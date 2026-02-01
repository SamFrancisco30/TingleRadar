from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.config import Settings
from app.models.youtube import YouTubeCredential, YouTubePlaylist
from app.schemas.youtube import (
    PlaylistSyncPayload,
    PlaylistSyncResponse,
    YouTubeStatusResponse,
)
from app.services.youtube import (
    add_videos_to_playlist,
    build_authorization_url,
    clear_playlist_items,
    create_playlist,
    exchange_code_for_tokens,
    refresh_access_token,
)

router = APIRouter()


def get_settings() -> Settings:
    return Settings()


@router.get("/youtube/auth", status_code=status.HTTP_307_TEMPORARY_REDIRECT)
def start_youtube_auth(settings: Settings = Depends(get_settings)) -> RedirectResponse:
    url = build_authorization_url(settings)
    return RedirectResponse(url)


@router.get("/youtube/auth/callback")
def youtube_auth_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code from YouTube OAuth")

    tokens = exchange_code_for_tokens(settings, code)
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not return a refresh token. Please re-authorize.",
        )

    credential = db.query(YouTubeCredential).first()
    if credential:
        credential.refresh_token = refresh_token
    else:
        credential = YouTubeCredential(refresh_token=refresh_token)
        db.add(credential)
    db.commit()
    db.refresh(credential)

    callback_path = "/api/auth/youtube/callback"
    redirect_base = settings.youtube_oauth_redirect or "/"
    if callback_path in redirect_base:
        redirect_base = redirect_base.split(callback_path)[0] or "/"
    return RedirectResponse(redirect_base)


@router.get("/youtube/status", response_model=YouTubeStatusResponse)
def youtube_status(db: Session = Depends(get_db)) -> YouTubeStatusResponse:
    credential = db.query(YouTubeCredential).first()
    playlist = db.query(YouTubePlaylist).first()
    return YouTubeStatusResponse(
        authorized=bool(credential),
        playlist_id=playlist.playlist_id if playlist else None,
    )


@router.post("/playlists/weekly/sync", response_model=PlaylistSyncResponse)
def sync_weekly_playlist(
    payload: PlaylistSyncPayload,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    credential = db.query(YouTubeCredential).first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="YouTube authorization is required. Please authorize first.",
        )

    access_token = refresh_access_token(settings, credential.refresh_token)
    playlist = db.query(YouTubePlaylist).first()

    if playlist and playlist.playlist_id:
        playlist_id = playlist.playlist_id
        clear_playlist_items(access_token, playlist_id)
    else:
        playlist_data = create_playlist(
            access_token,
            payload.title,
            payload.description or "",
        )
        playlist_id = playlist_data.get("id")
        if not playlist_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to create YouTube playlist",
            )
        if playlist:
            playlist.playlist_id = playlist_id
        else:
            playlist = YouTubePlaylist(playlist_id=playlist_id)
            db.add(playlist)
        db.commit()
        db.refresh(playlist)

    add_videos_to_playlist(access_token, playlist_id, payload.video_ids)
    playlist_url = f"https://www.youtube.com/playlist?list={playlist_id}"
    return PlaylistSyncResponse(playlist_id=playlist_id, playlist_url=playlist_url)

from typing import Iterable, Optional
from urllib.parse import urlencode

import requests
from fastapi import HTTPException

from app.core.config import Settings

YOUTUBE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_PLAYLISTS_URL = "https://www.googleapis.com/youtube/v3/playlists"
YOUTUBE_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"

PLAYLIST_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl"
PLAYLIST_PRIVACY = "private"


def _ensure_oauth_settings(settings: Settings) -> None:
    missing = [
        key
        for key in ("youtube_client_id", "youtube_client_secret", "youtube_oauth_redirect")
        if not getattr(settings, key)
    ]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Missing YouTube OAuth configuration: {', '.join(missing)}",
        )


def build_authorization_url(settings: Settings) -> str:
    _ensure_oauth_settings(settings)
    params = {
        "client_id": settings.youtube_client_id,
        "redirect_uri": settings.youtube_oauth_redirect,
        "response_type": "code",
        "scope": PLAYLIST_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": "tingleradar",
    }
    return f"{YOUTUBE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(settings: Settings, code: str) -> dict:
    _ensure_oauth_settings(settings)
    payload = {
        "client_id": settings.youtube_client_id,
        "client_secret": settings.youtube_client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.youtube_oauth_redirect,
    }
    response = requests.post(YOUTUBE_TOKEN_URL, data=payload, timeout=10)
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code or 502,
            detail=_format_youtube_error(response),
        )
    return response.json()


def refresh_access_token(settings: Settings, refresh_token: str) -> str:
    _ensure_oauth_settings(settings)
    payload = {
        "client_id": settings.youtube_client_id,
        "client_secret": settings.youtube_client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    response = requests.post(YOUTUBE_TOKEN_URL, data=payload, timeout=10)
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code or 502,
            detail=_format_youtube_error(response),
        )
    response_data = response.json()
    access_token = response_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="Youtube didn\'t return an access token")
    return access_token


def create_playlist(access_token: str, title: str, description: str) -> dict:
    headers = _auth_headers(access_token)
    payload = {
        "snippet": {
            "title": title,
            "description": description,
            "defaultLanguage": "en",
            "tags": ["TingleRadar"],
        },
        "status": {"privacyStatus": PLAYLIST_PRIVACY},
    }
    response = requests.post(
        YOUTUBE_PLAYLISTS_URL,
        params={"part": "snippet,status"},
        json=payload,
        headers=headers,
        timeout=10,
    )
    if not response.ok:
        raise HTTPException(
            status_code=response.status_code or 502,
            detail=_format_youtube_error(response),
        )
    return response.json()


def clear_playlist_items(access_token: str, playlist_id: str) -> None:
    headers = _auth_headers(access_token)
    params = {"part": "id", "playlistId": playlist_id, "maxResults": 50}
    while True:
        response = requests.get(
            YOUTUBE_PLAYLIST_ITEMS_URL,
            params=params,
            headers=headers,
            timeout=10,
        )
        if not response.ok:
            raise HTTPException(
                status_code=response.status_code or 502,
                detail=_format_youtube_error(response),
            )
        payload = response.json()
        items = payload.get("items", [])
        for item in items:
            item_id = item.get("id")
            if not item_id:
                continue
            delete_response = requests.delete(
                YOUTUBE_PLAYLIST_ITEMS_URL,
                params={"id": item_id},
                headers=headers,
                timeout=10,
            )
            if not delete_response.ok:
                raise HTTPException(
                    status_code=delete_response.status_code or 502,
                    detail=_format_youtube_error(delete_response),
                )
        next_token = payload.get("nextPageToken")
        if not next_token:
            break
        params["pageToken"] = next_token


def add_videos_to_playlist(access_token: str, playlist_id: str, video_ids: Iterable[str]) -> None:
    headers = _auth_headers(access_token)
    for video_id in video_ids:
        payload = {
            "snippet": {
                "playlistId": playlist_id,
                "resourceId": {"kind": "youtube#video", "videoId": video_id},
            }
        }
        response = requests.post(
            YOUTUBE_PLAYLIST_ITEMS_URL,
            params={"part": "snippet"},
            json=payload,
            headers=headers,
            timeout=10,
        )
        if not response.ok:
            raise HTTPException(
                status_code=response.status_code or 502,
                detail=_format_youtube_error(response),
            )


def _auth_headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def _format_youtube_error(response: requests.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "Unknown YouTube error"
    detail = payload.get("error_description") or payload.get("error")
    if isinstance(detail, dict):
        message = detail.get("message")
        if message:
            return message
    if isinstance(detail, str):
        return detail
    if isinstance(payload, dict) and payload.get("error_description"):
        return payload["error_description"]
    return str(payload)

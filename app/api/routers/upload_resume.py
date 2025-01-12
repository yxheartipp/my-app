import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.routers.models import DocumentFile
from app.services.file import FileService

resume_upload_router = r = APIRouter()

logger = logging.getLogger("uvicorn")


class ResumeUploadRequest(BaseModel):
    base64: str
    name: str
    company: str
    position: str
    params: Any = None


@r.post("")
def upload_resume(request: ResumeUploadRequest) -> DocumentFile:
    """
    To upload a resume file from the chat UI.
    """
    try:
        logger.info(f"Processing resume: {request.name} for {request.position} at {request.company}")
        
        # 添加简历相关信息到params
        resume_params = {
            **(request.params or {}),
            "is_resume": True,
            "company": request.company,
            "position": request.position
        }
        
        return FileService.process_private_file(
            request.name, 
            request.base64, 
            resume_params
        )
    except Exception as e:
        logger.error(f"Error processing resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing resume") 
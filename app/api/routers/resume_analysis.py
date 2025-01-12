import logging
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.engine.engine import get_chat_engine
from app.api.routers.models import Message, MessageRole, Result, SourceNodes

resume_analysis_router = r = APIRouter()
logger = logging.getLogger("uvicorn")

class ResumeAnalysisRequest(BaseModel):
    company: str
    position: str
    fileIds: List[str]

@r.post("/analyze")
async def analyze_resume(request: ResumeAnalysisRequest) -> Result:
    """
    分析简历与目标职位的匹配度
    """
    try:
        # 构建分析提示词
        prompt = f"""
        我是一名求职者，正在申请 {request.company} 的 {request.position} 职位。
        请根据我的简历内容，从以下几个方面进行分析：
        1. 我的主要优势和亮点
        2. 与职位要求的匹配度
        3. 存在的不足和改进建议
        4. 简历修改建议
        5. 面试准备建议
        
        请详细分析并给出具体的建议。
        """

        # 使用文档ID过滤
        filters = {"doc_id": {"$in": request.fileIds}} if request.fileIds else None
        
        # 获取聊天引擎
        chat_engine = get_chat_engine(filters=filters)
        
        # 执行分析
        response = await chat_engine.achat(prompt)
        
        return Result(
            result=Message(
                role=MessageRole.ASSISTANT,
                content=response.response,
            ),
            nodes=SourceNodes.from_source_nodes(response.source_nodes),
        )
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 
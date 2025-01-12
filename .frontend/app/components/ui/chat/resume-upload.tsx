"use client";

import { ChatInput, Message, useChatUI, useFile } from "@llamaindex/chat-ui";
import { DocumentInfo } from "@llamaindex/chat-ui/widgets";
import { useClientConfig } from "./hooks/use-config";
import { useState } from "react";

export default function ResumeUpload() {
  const { requestData, setMessages } = useChatUI();
  const { backend } = useClientConfig();
  const { uploadFile, files, removeDoc } = useFile({ 
    uploadAPI: `${backend}/api/chat/upload-resume` 
  });
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const handleResumeUpload = async (file: File) => {
    if (!company.trim() || !position.trim()) {
      alert("请填写目标公司和职位");
      return;
    }

    if (!file.name.endsWith('.pdf')) {
      alert("请上传PDF格式的简历文件");
      return;
    }

    try {
      const resumeRequestData = {
        ...requestData,
        isResume: true,
        company,
        position
      };
      
      await uploadFile(file, resumeRequestData);
      alert("简历上传成功！");
      // 清空输入
      setCompany("");
      setPosition("");
    } catch (error: any) {
      alert(`简历上传失败: ${error.message}`);
    }
  };

  const handleSendResume = async () => {
    if (!files.length) {
      alert("请先上传简历");
      return;
    }

    if (!company.trim() || !position.trim()) {
      alert("请填写目标公司和职位");
      return;
    }

    try {
      const response = await fetch(`${backend}/api/chat/resume/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company,
          position,
          fileIds: files.map(f => f.id)
        }),
      });

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const result = await response.json();
      
      // 添加用户消息和AI回复到聊天界面
      setMessages((messages: Message[]) => [
        ...messages,
        {
          role: 'user',
          content: `请分析我申请${company}的${position}职位的简历`,
        },
        {
          role: 'assistant',
          content: result.result.content,
        }
      ]);
      
      setCompany("");
      setPosition("");
      
    } catch (error: any) {
      alert(`分析失败: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 max-w-xl w-full mx-auto">
      <div className="text-center">
        <h2 className="text-lg font-semibold">欢迎使用AI简历助手</h2>
        <p className="text-sm text-gray-600 mt-2">请上传您的PDF格式简历，AI将为您分析并提供建议</p>
      </div>
      
      <div className="w-full space-y-4">
        <input
          type="text"
          placeholder="目标公司"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="应聘职位"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {files.length > 0 && (
        <div className="flex gap-4 w-full overflow-auto py-2">
          {files.map((file) => (
            <DocumentInfo
              key={file.id}
              document={{ url: file.url, sources: [] }}
              className="mb-2 mt-2"
              onRemove={() => removeDoc(file)}
            />
          ))}
        </div>
      )}

      <div className="w-full flex gap-4">
        <ChatInput.Upload 
          onUpload={handleResumeUpload}
        />
        <button
          onClick={handleSendResume}
          disabled={!files.length}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送简历
        </button>
      </div>
    </div>
  );
} 
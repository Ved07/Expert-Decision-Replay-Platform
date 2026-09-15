from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv
from copilot_parser import process_attached_files

load_dotenv()

router = APIRouter(prefix="/copilot", tags=["copilot"])

class CopilotQueryRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    files: Optional[List[Dict[str, Any]]] = None

class CopilotQueryResponse(BaseModel):
    status: str
    reply: str
    suggestions: List[str] = []

SYSTEM_INSTRUCTION = (
    "You are EDRP Copilot, the intelligent real-time AI assistant for the Expert Decision Replay Platform. "
    "Your mission is to assist managers, reviewers, and team members in recording decisions, conducting decision replays, "
    "evaluating alternatives, managing approval workflows, analyzing attachments/data, and reviewing platform audit logs.\n\n"
    "FORMATTING & TONE GUIDELINES:\n"
    "- Provide clear, beautifully structured, accurate, and professional answers.\n"
    "- Format key points using clean bullet points and bold headers.\n"
    "- When presenting multi-step instructions, use ordered numbered steps or well-organized tables.\n"
    "- If the user uploads attachments (Excel, CSV, PDF, Images, or Text), thoroughly analyze the extracted content, "
    "highlight key metrics/findings, and provide actionable recommendations.\n"
    "- Keep explanations concise and avoid repetitive formatting or unnecessary symbols."
)

DEFAULT_SUGGESTIONS = [
    "How do I record a new decision?",
    "Where can I find decisions pending my review?",
    "How do team approvals work?",
    "How do I export decisions to PDF/Excel?",
]


def build_system_prompt(context: Optional[Dict[str, Any]] = None, files: Optional[List[Dict[str, Any]]] = None) -> str:
    """Inject current application context, user context, and parsed file data into the system prompt."""
    prompt = SYSTEM_INSTRUCTION
    if context:
        ctx_lines = []
        if context.get("currentPath"):
            ctx_lines.append(f"- Active Page Route: {context['currentPath']}")
        if context.get("pageTitle"):
            ctx_lines.append(f"- Active Page: {context['pageTitle']}")
        if context.get("decisionId"):
            ctx_lines.append(f"- Active Decision ID: {context['decisionId']}")
        if context.get("decisionTitle"):
            ctx_lines.append(f"- Active Decision Title: '{context['decisionTitle']}'")
        if context.get("decisionStatus"):
            ctx_lines.append(f"- Active Decision Status: {context['decisionStatus']}")
        if context.get("decisionCategory"):
            ctx_lines.append(f"- Active Decision Category: {context['decisionCategory']}")
        if context.get("decisionDescription"):
            summary = str(context["decisionDescription"])[:250]
            ctx_lines.append(f"- Active Decision Summary: {summary}")
        if context.get("userRole"):
            ctx_lines.append(f"- Current User Role: {context['userRole']}")
        if context.get("userName"):
            ctx_lines.append(f"- Current User Name: {context['userName']}")

        if ctx_lines:
            prompt += (
                "\n\nCURRENT APPLICATION & USER CONTEXT:\n"
                + "\n".join(ctx_lines)
                + "\nUtilize this context whenever the user refers to 'this decision', 'my team', 'this page', etc."
            )

    if files:
        files_context = process_attached_files(files)
        if files_context:
            prompt += files_context

    return prompt


def generate_context_suggestions(context: Optional[Dict[str, Any]] = None) -> List[str]:
    """Generate dynamic, context-aware suggestions tailored to the active screen."""
    if not context:
        return DEFAULT_SUGGESTIONS

    path = context.get("currentPath", "")
    decision_title = context.get("decisionTitle")
    decision_id = context.get("decisionId")

    if "/decisions/" in path and decision_id:
        title_snippet = f"'{decision_title}'" if decision_title else f"Decision #{decision_id}"
        return [
            f"Summarize {title_snippet}",
            "What is the next required approval stage?",
            "What alternatives could be considered here?",
            "How do I export this decision to PDF?",
        ]
    elif path == "/decisions/new":
        return [
            "How do I write an effective decision rationale?",
            "What should I include in the alternatives section?",
            "Who will be notified when I submit this decision?",
            "How does the multi-stage approval workflow operate?",
        ]
    elif path == "/team":
        return [
            "How do I assign users to my team?",
            "Who has permission to manage team assignments?",
            "How do team roles affect the review hierarchy?",
        ]
    elif path == "/audit-log":
        return [
            "What actions are recorded in the audit log?",
            "How are decision version histories tracked?",
            "How do I inspect previous versions of a decision?",
        ]
    elif path == "/users":
        return [
            "What permissions do different user roles have?",
            "How do I change a user's role to Reviewer or Manager?",
            "Who can access the user management panel?",
        ]

    return DEFAULT_SUGGESTIONS


DEFAULT_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
    "groq/compound-mini",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


def get_models_to_try() -> List[str]:
    custom_model = os.getenv("GROQ_MODEL") or os.getenv("AI_MODEL")
    if custom_model and custom_model.strip():
        return [custom_model.strip()] + [m for m in DEFAULT_MODELS if m != custom_model.strip()]
    return list(DEFAULT_MODELS)


@router.post("/chat", response_model=CopilotQueryResponse)
def handle_copilot_chat(request: CopilotQueryRequest):
    """
    Copilot AI Assistant endpoint integrated with Groq API (non-streaming with context & file attachments).
    """
    user_msg = request.message.strip()
    if not user_msg:
        if request.files and len(request.files) > 0:
            user_msg = "Please analyze the attached file(s), extract key details, summarize the data/findings, and provide actionable recommendations."
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content or file attachment cannot be empty."
            )

    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    suggestions = generate_context_suggestions(request.context)

    if not groq_key or not groq_key.strip():
        return CopilotQueryResponse(
            status="unconfigured",
            reply="GROQ_API_KEY is not set in backend .env file. Please add your GROQ_API_KEY to enable live Groq AI responses.",
            suggestions=suggestions
        )

    groq_key = groq_key.strip()
    system_prompt = build_system_prompt(request.context, request.files)
    models_to_try = get_models_to_try()

    reply_text = None
    last_error = None

    for model_name in models_to_try:
        try:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg}
                ],
                "temperature": 0.7
            }
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "EDRPCopilot/1.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                if "choices" in res_data and len(res_data["choices"]) > 0:
                    reply_text = res_data["choices"][0]["message"]["content"]
                    if reply_text:
                        break
        except urllib.error.HTTPError as http_err:
            try:
                err_body = http_err.read().decode("utf-8")
                err_json = json.loads(err_body)
                last_error = err_json.get("error", {}).get("message", err_body[:150])
            except Exception:
                last_error = f"HTTP {http_err.code}: {str(http_err)}"
            continue
        except Exception as err:
            last_error = str(err)
            continue

    if not reply_text:
        err_msg = last_error if last_error else "No response returned from Groq API."
        if groq_key and groq_key in err_msg:
            err_msg = err_msg.replace(groq_key, "[REDACTED]")

        return CopilotQueryResponse(
            status="error",
            reply=f"Groq API Error: {err_msg[:200]}",
            suggestions=suggestions
        )

    return CopilotQueryResponse(
        status="success",
        reply=reply_text.strip(),
        suggestions=suggestions
    )


@router.post("/stream")
def handle_copilot_stream(request: CopilotQueryRequest):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint for Copilot Assistant with file attachments.
    Streams individual AI response tokens directly to the frontend.
    """
    user_msg = request.message.strip()
    if not user_msg:
        if request.files and len(request.files) > 0:
            user_msg = "Please analyze the attached file(s), extract key details, summarize the data/findings, and provide actionable recommendations."
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content or file attachment cannot be empty."
            )

    load_dotenv(override=True)
    groq_key = os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY")
    suggestions = generate_context_suggestions(request.context)

    if not groq_key or not groq_key.strip():
        def unconfigured_stream():
            yield f"data: {json.dumps({'error': 'GROQ_API_KEY is not set in backend .env file.', 'done': True, 'suggestions': suggestions})}\n\n"
        return StreamingResponse(unconfigured_stream(), media_type="text/event-stream")

    groq_key = groq_key.strip()
    system_prompt = build_system_prompt(request.context, request.files)

    def event_stream_generator():
        models_to_try = get_models_to_try()
        stream_started = False
        last_error = None

        for model_name in models_to_try:
            try:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    "temperature": 0.7,
                    "stream": True
                }
                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                        "User-Agent": "EDRPCopilot/1.0"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    stream_started = True
                    for raw_line in resp:
                        line = raw_line.decode("utf-8").strip()
                        if not line or not line.startswith("data:"):
                            continue
                        data_str = line[5:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data_str)
                            choices = chunk_data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                token = delta.get("content")
                                if token:
                                    yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
                        except json.JSONDecodeError:
                            continue
                    break  # Successfully completed streaming
            except urllib.error.HTTPError as http_err:
                try:
                    err_body = http_err.read().decode("utf-8")
                    err_json = json.loads(err_body)
                    last_error = err_json.get("error", {}).get("message", err_body[:150])
                except Exception:
                    last_error = f"HTTP {http_err.code}: {str(http_err)}"
                if stream_started:
                    break
                continue
            except Exception as e:
                last_error = str(e)
                if stream_started:
                    # If stream already began sending to client, don't retry another model mid-stream
                    break
                continue

        if not stream_started:
            err_msg = last_error if last_error else "Failed to establish stream with AI provider."
            if groq_key and groq_key in err_msg:
                err_msg = err_msg.replace(groq_key, "[REDACTED]")
            yield f"data: {json.dumps({'error': err_msg[:200], 'done': True, 'suggestions': suggestions})}\n\n"
        else:
            yield f"data: {json.dumps({'done': True, 'suggestions': suggestions})}\n\n"

    return StreamingResponse(
        event_stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

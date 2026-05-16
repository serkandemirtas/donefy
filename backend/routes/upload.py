import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router     = APIRouter()
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED    = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Unsupported file type.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "File exceeds 10 MB limit.")
    ext  = Path(file.filename).suffix.lower() or ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"image_path": f"uploads/{name}"}


@router.delete("/upload/{filename}")
def delete_image(filename: str):
    if "/" in filename or "\\" in filename: raise HTTPException(400, "Invalid filename.")
    t = UPLOAD_DIR / filename
    if t.exists(): t.unlink()
    return {"message": "Deleted."}

import json, time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from scheduler import get_queue

router = APIRouter()


@router.get("/notifications/stream")
def stream():
    def _gen():
        last_hb = time.time()
        while True:
            for item in get_queue():
                yield f"data: {json.dumps(item)}\n\n"
            if time.time() - last_hb >= 25:
                yield ": heartbeat\n\n"
                last_hb = time.time()
            time.sleep(2)
    return StreamingResponse(_gen(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

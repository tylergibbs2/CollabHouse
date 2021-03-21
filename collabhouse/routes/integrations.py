import re

from quart import current_app as app
from quart import Blueprint, request

from .room import Room, RoomComponent


integrations_blueprint = Blueprint("integrations", __name__)


async def extract_content(content: str):
    """
    Extracts content from raw content.

    Returns [(type, content, content_extra), ...]
    """
    extracted = []
    seen_links = set()

    image_urls = re.finditer(r"\S+(?:\.png|\.jpeg|\.jpg|\.gif)", content)
    for match in image_urls:
        seen_links.add(match.group(0))
        extracted.append(("image", match.group(0), None))

    code_blocks = re.finditer(r"```[a-z]*\n([\s\S]*?)\n```", content)
    for match in code_blocks:
        extracted.append(("code", match.group(1), None))

    youtube_links = re.finditer(r"(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)", content)
    for match in youtube_links:
        seen_links.add(match.group(0))
        video_id = match.group(1)
        extracted.append(("video", f"https://youtube.com/embed/{video_id}", None))

    urls = re.finditer(r"(http|https)://([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?", content)
    for match in urls:
        if match.group(0) not in seen_links:
            extracted.append(("link", match.group(0), match.group(2)))

    return extracted


@integrations_blueprint.route("/api/receive", methods=["POST"])
async def receive():
    try:
        data = await request.get_json()
    except Exception:
        return {"status": 400, "error": "Invalid POST data."}, 400

    room_ids = data.get("room_ids", [])
    raw_content = data.get("content")

    for room_id in room_ids:
        exists = await Room.exists(room_id)
        if not exists:
            continue

        results = await extract_content(raw_content)

        for content_type, content, content_extra in results:
            component = {
                "type": content_type,
                "content": content,
                "content_extra": content_extra,
                "x_pos": 50,
                "y_pos": 50
            }

            await RoomComponent.new(room_id, component)

    return {}

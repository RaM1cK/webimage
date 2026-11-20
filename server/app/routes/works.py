from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import Work
from ..services.storage import delete_object
from .work_support import (
    current_user_id,
    get_owned_work,
    normalize_metadata,
    parse_work_payload,
    replace_work_file,
    save_inline_content,
    serialize_work,
)

works_bp = Blueprint("works", __name__)


@works_bp.get("")
@jwt_required()
def list_works():
    user_id = current_user_id()
    works = Work.query.filter_by(user_id=user_id).order_by(Work.updated_at.desc()).all()
    return jsonify({"works": [serialize_work(work) for work in works]})


@works_bp.post("")
@jwt_required()
def create_work():
    user_id = current_user_id()
    payload = parse_work_payload()

    title = payload.get("title") or "Untitled"
    work_type = payload.get("work_type") or "raster"
    if work_type not in ("raster", "svg", "3d"):
        return jsonify({"error": "Invalid workType"}), 400

    work = Work(user_id=user_id, title=title, work_type=work_type)
    metadata = normalize_metadata(payload.get("metadata"))
    if metadata is not None:
        work.metadata_json = metadata

    file_storage = payload.get("file")
    if file_storage and file_storage.filename:
        replace_work_file(work, file_storage)

    db.session.add(work)
    db.session.commit()
    return jsonify({"work": serialize_work(work)}), 201


@works_bp.get("/<int:work_id>")
@jwt_required()
def get_work(work_id):
    work = get_owned_work(work_id)
    if not work:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"work": serialize_work(work, include_inline_content=True)})


@works_bp.put("/<int:work_id>")
@jwt_required()
def update_work(work_id):
    work = get_owned_work(work_id)
    if not work:
        return jsonify({"error": "Not found"}), 404

    payload = parse_work_payload()

    if payload.get("title") is not None:
        work.title = payload["title"]

    metadata = normalize_metadata(payload.get("metadata"))
    if metadata is not None:
        work.metadata_json = metadata

    content = payload.get("content")
    file_storage = payload.get("file")
    if content is not None:
        save_inline_content(work, content, payload.get("content_type"))
    elif file_storage and file_storage.filename:
        replace_work_file(work, file_storage)

    db.session.commit()
    return jsonify({"work": serialize_work(work)})


@works_bp.post("/<int:work_id>/autosave")
@jwt_required()
def autosave_work(work_id):
    return update_work(work_id)


@works_bp.delete("/<int:work_id>")
@jwt_required()
def delete_work(work_id):
    work = get_owned_work(work_id)
    if not work:
        return jsonify({"error": "Not found"}), 404

    if work.file_key:
        delete_object(work.file_key)
    if work.preview_key:
        delete_object(work.preview_key)

    db.session.delete(work)
    db.session.commit()
    return "", 204

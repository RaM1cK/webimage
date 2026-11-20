from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from ..services.threed_geometry import (
    build_export_payload,
    create_empty_scene,
    create_primitive_mesh,
    mesh_to_scene_object,
)

threed_bp = Blueprint("threed", __name__)


@threed_bp.post("/scene")
@jwt_required()
def create_scene():
    data = request.get_json(silent=True) or {}
    return jsonify({"scene": create_empty_scene(data.get("size"))}), 201


@threed_bp.post("/primitives/<kind>")
@jwt_required()
def create_primitive(kind):
    data = request.get_json(silent=True) or {}
    try:
        mesh = create_primitive_mesh(kind, data)
    except ValueError:
        return jsonify({"error": "Unsupported primitive"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    obj = mesh_to_scene_object(mesh, name=kind, color=data.get("color", [180, 180, 180, 255]))
    obj["position"] = data.get("position", [0, 0, 0])
    obj["scale"] = data.get("scale", [1, 1, 1])
    obj["id"] = data.get("id") or kind
    return jsonify({"object": obj}), 201


@threed_bp.post("/transform")
@jwt_required()
def transform_object():
    data = request.get_json(silent=True) or {}
    obj = data.get("object")
    if not obj:
        return jsonify({"error": "object is required"}), 400

    for key in ("position", "scale", "rotation"):
        if key in data:
            obj[key] = data[key]

    return jsonify({"object": obj})


@threed_bp.post("/export")
@jwt_required()
def export_scene():
    data = request.get_json(silent=True) or {}
    scene = data.get("scene")
    fmt = (data.get("format") or "glb").lower()
    if not scene:
        return jsonify({"error": "scene is required"}), 400

    try:
        payload = build_export_payload(scene, fmt=fmt, logger=current_app.logger)
        return jsonify(payload)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

import base64
from io import BytesIO

import numpy as np
import trimesh


def mesh_to_scene_object(mesh: trimesh.Trimesh, name="object", color=None):
    return {
        "name": name,
        "vertices": mesh.vertices.tolist(),
        "faces": mesh.faces.tolist(),
        "normals": mesh.vertex_normals.tolist() if mesh.vertex_normals is not None else [],
        "color": color or [180, 180, 180, 255],
        "position": [0, 0, 0],
        "scale": [1, 1, 1],
        "rotation": [0, 0, 0],
    }


def create_empty_scene(size=None):
    return {
        "size": size or [10, 10, 10],
        "objects": [],
        "camera": {"position": [8, 8, 8], "target": [0, 0, 0]},
    }


def create_primitive_mesh(kind, params):
    if kind == "cube":
        return trimesh.creation.box(extents=(1.0, 1.0, 1.0))
    if kind == "sphere":
        return trimesh.creation.icosphere(subdivisions=3, radius=float(params.get("radius", 0.5)))
    if kind == "cylinder":
        return trimesh.creation.cylinder(radius=float(params.get("radius", 0.5)), height=float(params.get("height", 1.0)))
    if kind == "cone":
        return trimesh.creation.cone(radius=float(params.get("radius", 0.5)), height=float(params.get("height", 1.0)))
    if kind == "torus":
        return trimesh.creation.torus(
            major_radius=float(params.get("radius", 0.6)),
            minor_radius=float(params.get("tube", 0.2)),
        )
    raise ValueError("Unsupported primitive")


def build_export_payload(scene, fmt="glb", logger=None):
    meshes = []
    for obj in scene.get("objects", []):
        try:
            vertices = np.array(obj.get("vertices", []), dtype=float)
            faces = np.array(obj.get("faces", []), dtype=int)
            if len(vertices) == 0 or len(faces) == 0:
                continue

            mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
            scale = np.array(obj.get("scale", [1, 1, 1]), dtype=float)
            position = np.array(obj.get("position", [0, 0, 0]), dtype=float)

            if scale.shape == (3,):
                mesh.vertices *= scale
            mesh.apply_translation(position)
            meshes.append(mesh)
        except Exception:
            if logger:
                logger.exception("Failed to process mesh object during 3D export (object_id=%s)", obj.get("id"))
            continue

    if not meshes:
        raise ValueError("No valid meshes to export")

    combined = trimesh.util.concatenate(meshes)
    buffer = BytesIO()
    combined.export(buffer, file_type=fmt)
    buffer.seek(0)

    return {
        "filename": f"scene.{fmt}",
        "contentType": "model/gltf-binary" if fmt == "glb" else "application/octet-stream",
        "dataBase64": base64.b64encode(buffer.read()).decode("ascii"),
    }

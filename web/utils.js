export function onDrag(element, handler) {
    element.addEventListener("pointermove", (e) => {
        if (e.buttons & 1) {
            return handler(e);
        }
    });

    element.addEventListener("pointerdown", (e) => {
        console.log("grab", e.target)
        element.setPointerCapture(e.pointerId);
    });

    element.addEventListener("pointerup", (e) => {
        console.log("release", e.target)
        try { element.releasePointerCapture(e.pointerId); } catch (err) {}
    });
}
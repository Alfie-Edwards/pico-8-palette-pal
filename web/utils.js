export function onDrag(element, handler) {
    const listener = (e) => {
        if (e.buttons & 1) {
            return handler(e);
        }
    }

    element.addEventListener("pointerdown", (e) => {
        console.log("grab", e.target)
        element.setPointerCapture(e.pointerId);
        listener(e);
        element.addEventListener("pointermove", listener);
    });

    element.addEventListener("pointerup", (e) => {
        console.log("release", e.target)
        try { element.releasePointerCapture(e.pointerId); } catch (err) {}
        try { element.removeEventListener("pointermove", listener); } catch (err) {};
    });
}
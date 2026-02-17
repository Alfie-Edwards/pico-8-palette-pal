export function onDrag(element, handler) {
    var origin = {x: 0, y: 0};

    const listener = (e) => {
        if (e.buttons & 1) {
            const client_rect = e.target.getBoundingClientRect();
            return handler(e, { x: e.clientX - client_rect.x - origin.x, y: e.clientY - client_rect.y - origin.y });
        }
    }

    element.addEventListener("pointerdown", (e) => {
        const client_rect = e.target.getBoundingClientRect();
        origin = { x: e.clientX - client_rect.x, y: e.clientY - client_rect.y }
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
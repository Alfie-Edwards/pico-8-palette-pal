use std::sync::{OnceLock, atomic::AtomicU32};

pub type Id = u32;

static NEXT_ID: OnceLock<AtomicU32> = OnceLock::new();

pub fn new_id() -> Id {
    NEXT_ID.get_or_init(|| AtomicU32::new(0)).fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

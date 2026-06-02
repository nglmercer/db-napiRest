interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div class="login-modal-overlay" onClick={onClose}>
      <div class="login-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Login Required</h2>
        <p>You need to be logged in to perform this action.</p>
        <div class="login-modal-actions">
          <a href="#/login" class="btn-primary" onClick={onClose}>
            Login
          </a>
          <button class="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

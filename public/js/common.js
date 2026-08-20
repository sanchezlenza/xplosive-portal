// Shared across all logged-in pages: checks session, fills nav, wires logout.
async function initNav(activePage) {
  const res = await fetch('/auth/me');
  const { user } = await res.json();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }

  const navLinks = document.getElementById('navlinks');
  if (navLinks) {
    const links = [
      { href: '/dashboard.html', label: 'Dashboard' },
      { href: '/calendario.html', label: 'Calendar' },
      { href: '/eventos.html', label: 'Events' },
      { href: '/competencias.html', label: 'Competitions' },
      { href: '/supplies.html', label: 'Supplies' }
    ];
    if (user.role === 'admin') links.push({ href: '/admin.html', label: 'Admin' });

    navLinks.innerHTML = links.map(l =>
      `<a href="${l.href}" class="${activePage === l.href ? 'active' : ''}">${l.label}</a>`
    ).join('') +
      `<span class="who">${user.name}</span>` +
      `<button id="logoutBtn">Log out</button>`;

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    });
  }
  return user;
}

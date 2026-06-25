function normalizarArea(area) {
    return (area || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
}

function generarVisualVehiculo(patrullero) {
    const marca = (patrullero.marca || '').toUpperCase().trim();
    const modelo = (patrullero.modelo || '').toUpperCase().trim();
    const area = normalizarArea(patrullero.area);
    let imagen = null;

    if (modelo === 'AMAROK' && area === 'POLICIAL') {
        imagen = 'img/amarok_policial.png';
    } else if (modelo === 'AMAROK' && area === 'SECRETARIA') {
        imagen = 'img/amarok_secretaria.png';
    } else if (marca === 'TOYOTA' && area === 'POLICIAL') {
        imagen = 'img/toyota_policial.png';
    } else if (marca === 'TOYOTA') {
        imagen = 'img/toyota.png';
    } else if (marca === 'BENELLI') {
        imagen = 'img/benelli.png';
    } else if (marca === 'FORD' && area === 'POLICIAL') {
        imagen = 'img/ford_policial.png';
    } else if (marca === 'FIAT') {
        imagen = 'img/fiat.png';
    } else if (marca === 'HONDA') {
        imagen = 'img/honda.png';
    } else if (marca === 'NISSAN' && area === 'SECRETARIA') {
        imagen = 'img/nissan_secretaria.png';
    }

    if (imagen) {
        return { html: `<img src="${imagen}" alt="${marca} ${patrullero.modelo || ''}">`, esFoto: true };
    }
    return { html: generarSVGPatrullero(patrullero), esFoto: false };
}

function generarSVGPatrullero(patrullero) {
    const op = patrullero.operativo;
    return `
        <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="80" y="82" width="240" height="76" rx="14" fill="#e7ecf3" stroke="#1f2c44" stroke-width="2"/>
            <rect x="80" y="82" width="240" height="22" fill="${op ? '#3b82f6' : '#5b6a85'}"/>
            <ellipse cx="200" cy="80" rx="78" ry="38" fill="#e7ecf3" stroke="#1f2c44" stroke-width="2"/>
            <circle cx="122" cy="158" r="19" fill="#0b1320"/>
            <circle cx="278" cy="158" r="19" fill="#0b1320"/>
            <circle cx="122" cy="158" r="9" fill="#5b6a85"/>
            <circle cx="278" cy="158" r="9" fill="#5b6a85"/>
            <rect x="102" y="96" width="48" height="28" fill="#1f2c44" stroke="#0b1320" stroke-width="1"/>
            <rect x="250" y="96" width="48" height="28" fill="#1f2c44" stroke="#0b1320" stroke-width="1"/>
            <rect x="170" y="48" width="60" height="14" rx="3" fill="#14203f" stroke="#0b1320" stroke-width="1.5"/>
            <rect x="170" y="48" width="29" height="14" rx="3" fill="${op ? '#ef4444' : '#3b4a66'}"/>
            <rect x="200" y="48" width="30" height="14" rx="3" fill="${op ? '#3b82f6' : '#3b4a66'}"/>
            <rect x="168" y="148" width="64" height="20" fill="#ffffff" stroke="#0b1320" stroke-width="1"/>
            <text x="200" y="162" text-anchor="middle" font-size="11" font-weight="700" fill="#0b1320" font-family="Segoe UI, Arial">${patrullero.numero}</text>
        </svg>
    `;
}

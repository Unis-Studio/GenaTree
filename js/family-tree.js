// Configuration
const FAMILY_DATA_URL = 'data/family-data.json';
const WORKER_URL = 'https://divine-moon-e24f.ptitleo2009.workers.dev/';
const GUILD_ID = '1025887285461405817';
const NEUTRAL_IMG = 'https://kiro701.github.io/BoucleRP/Image/Profil-Neutre.avif';

// Front-end
const genaTree = document.getElementById('genaTree');

genaTree.innerHTML = `
        <main class="family-page">
            <section class="family-app" id="familyApp" aria-label="Arbre de famille de cœur">
                <aside class="family-panel collapsed" id="familyPanel">
                    <h2>Famille Hamilton</h2>
                    <p class="subtitle">Arbre global avec relations familiales, amoureuses et
                        séparations.</p>
                    <input id="familySearch" class="family-search" placeholder="🔍 Rechercher une personne…"
                        oninput="searchPeople()">
    
                    <div class="panel-section-title">Filtres</div>
                    <label class="check-row"><input id="showLove" type="checkbox" checked onchange="renderTree()">Relations
                        amoureuses</label>
                    <label class="check-row"><input id="showFamily" type="checkbox" checked onchange="renderTree()">Liens
                        familiaux</label>
    
                    <button class="family-btn full" onclick="clearSelection()">Désélectionner</button>
                    <button class="family-btn full" onclick="resetView()">⟳ Réinitialiser</button>
    
                    <div class="family-stats">
                        <div class="family-stat"><strong id="statPeople">0</strong><span>membres</span></div>
                        <div class="family-stat"><strong id="statRelations">0</strong><span>relations</span></div>
                    </div>
    
                    <div class="legend-card">
                        <div class="panel-section-title" style="margin-top:0">Légende</div>
                        <div class="legend-row"><span class="line-sample"></span><span>Lien
                                familial</span></div>
                        <div class="legend-row"><span class="line-sample love"></span><span>Relation amoureuse</span></div>
                        <div class="legend-row"><span class="ring-sample"
                                style="border-color:var(--hmc-male)"></span><span>Homme</span></div>
                        <div class="legend-row"><span class="ring-sample"
                                style="border-color:var(--hmc-female)"></span><span>Femme</span></div>
                        <div class="legend-row"><span class="ring-sample"
                                style="border-color:var(--hmc-yellow)"></span><span>Non-binaire</span></div>
                        <div class="legend-row"><span class="ring-sample"
                                style="border-color:var(--hmc-gray)"></span><span>Autre</span></div>
                    </div>
                </aside>
                <button class="panel-toggle" id="panelToggle" onclick="togglePanel()">›</button>
    
                <section class="family-workspace">
                    <div class="canvas-tools">
                        <button type="button" onclick="zoomBy(1.15)">+</button>
                        <button type="button" onclick="zoomBy(.85)">−</button>
                        <button type="button" onclick="centerTree()">⌖</button>
                        <button type="button" onclick="toggleFullscreen()">⛶</button>
                        <button type="button" onclick="clearSelection()">✕</button>
                    </div>
    
                    <div class="tree-stage" id="familyStage">
                        <div class="tree" id="familyTree">
                            <svg class="relations" id="relationsSvg"></svg>
                        </div>
                    </div>
    
                    <div class="modal" id="personModal" onclick="closeModal(event)">
                        <div class="modal-card" onclick="event.stopPropagation()">
                            <div class="modal-head">
                                <img id="modalImg" alt="Photo de profil">
                                <div>
                                    <h2 id="modalName" style="margin:0;font-size:22px;color:var(--hmc-text)"></h2>
                                    <p id="modalMeta" style="margin:4px 0 0;color:var(--hmc-muted)"></p>
                                </div>
                            </div>
                            <div class="popup-grid">
                                <div class="popup-box">
                                    <h3>Profil</h3>
                                    <div id="modalInfo" class="markdown-content"></div>
                                </div>
                                <div class="popup-box">
                                    <h3>Relations</h3>
                                    <div id="modalTags"></div>
                                </div>
                                <div class="popup-box">
                                    <h3>Réseaux sociaux</h3>
                                    <div id="modalSocials"></div>
                                </div>
                                <div class="popup-box">
                                    <h3>Navigation</h3><button class="family-btn full" onclick="centerOnSelected()">Centrer
                                        sur cette
                                        personne</button>
                                </div>
                            </div>
                            <button class="family-btn full" onclick="shareSelectedProfile()">🔗 Partager ce profil</button>
                            <button class="family-btn full"
                                onclick="document.getElementById('personModal').style.display='none'">Fermer</button>
                        </div>
                    </div>
                </section>
            </section>
        </main>`;


// Back-end
let people = [];
let families = [];
let relations = [];
let byId = {};
let selectedId = null;
let zoom = 1, panX = 0, panY = 0, isDragging = false;
let dragStart = { x: 0, y: 0 }, panStart = { x: 0, y: 0 };


const tree = document.getElementById('familyTree');
const svg = document.getElementById('relationsSvg');
const stage = document.getElementById('familyStage');

function getCurrentLang() {
    return localStorage.getItem('lang')
        || localStorage.getItem('language')
        || document.documentElement.lang
        || 'fr';
}

function t(key, fallback = '') {
    const lang = getCurrentLang();

    if (window.translations) {
        if (window.translations[lang] && window.translations[lang][key]) return window.translations[lang][key];
        if (window.translations[key] && window.translations[key][lang]) return window.translations[key][lang];
        if (window.translations.fr && window.translations.fr[key]) return window.translations.fr[key];
        if (window.translations[key] && window.translations[key].fr) return window.translations[key].fr;
    }

    return fallback || key;
}

function shareSelectedProfile() {
    if (!selectedId) return;

    const url = new URL(window.location.href);
    url.searchParams.set('profile', selectedId);

    navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Lien du profil copié !');
    });
}


function applyTransform() { tree.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; }

stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.person') || e.target.closest('button') || e.target.closest('.modal-card')) return;
    clearSelection(false);
    isDragging = true;
    stage.classList.add('dragging');
    dragStart = { x: e.clientX, y: e.clientY };
    panStart = { x: panX, y: panY };
    stage.setPointerCapture(e.pointerId);
});

stage.addEventListener('pointermove', e => {
    if (!isDragging) return;
    panX = panStart.x + (e.clientX - dragStart.x);
    panY = panStart.y + (e.clientY - dragStart.y);
    applyTransform();
});

stage.addEventListener('pointerup', () => { isDragging = false; stage.classList.remove('dragging'); });
stage.addEventListener('pointercancel', () => { isDragging = false; stage.classList.remove('dragging'); });

stage.addEventListener('wheel', e => {
    e.preventDefault();
    const oldZoom = zoom;
    const factor = e.deltaY < 0 ? 1.09 : 0.91;
    zoom = Math.max(.35, Math.min(2.2, zoom * factor));
    const rect = stage.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
    panY = mouseY - (mouseY - panY) * (zoom / oldZoom);
    applyTransform();
}, { passive: false });

function computeLevels() {
    const levels = {};
    const changedLimit = Math.max(20, people.length * 4);

    people.forEach(p => levels[p.id] = 0);

    for (let pass = 0; pass < changedLimit; pass++) {
        let changed = false;

        // 1 Pousse les enfants vers le bas en fonction du niveau des parents
        families.forEach(f => {
            const parentLevels = f.parents
                .map(id => levels[id])
                .filter(v => Number.isFinite(v));
            const wantedChildLevel = parentLevels.length
                ? Math.max(...parentLevels) + 1
                : 0;

            f.children.forEach(childId => {
                if ((levels[childId] ?? 0) < wantedChildLevel) {
                    levels[childId] = wantedChildLevel;
                    changed = true;
                }
            });
        });

        // 2) Synchronise les couples sur le même niveau
        relations
            .filter(r => r.type === 'love')
            .forEach(r => {
                if (levels[r.a] === undefined || levels[r.b] === undefined) return;
                const sameLevel = Math.max(levels[r.a], levels[r.b]);
                if (levels[r.a] !== sameLevel) { levels[r.a] = sameLevel; changed = true; }
                if (levels[r.b] !== sameLevel) { levels[r.b] = sameLevel; changed = true; }
            });

        // 3) NOUVEAU : remonte les parents si leurs enfants ont été poussés plus bas
        // (ex: un enfant aligné sur le niveau de son/sa conjoint(e) qui a des grands-parents)
        families.forEach(f => {
            if (!f.parents.length || !f.children.length) return;

            const childLevels = f.children
                .map(id => levels[id])
                .filter(v => Number.isFinite(v));

            if (!childLevels.length) return;

            const desiredParentLevel = Math.min(...childLevels) - 1;

            f.parents.forEach(pid => {
                if (Number.isFinite(desiredParentLevel) && (levels[pid] ?? 0) < desiredParentLevel) {
                    levels[pid] = desiredParentLevel;
                    changed = true;
                }
            });
        });

        if (!changed) break;
    }

    people.forEach(p => p.level = levels[p.id] ?? 0);
    return levels;
}
function computeSubtreeOrder() {
    // Clé de tri de base : ordre explicite si fourni, sinon ordre alphabétique.
    const sortedByName = [...people].sort((a, b) => a.name.localeCompare(b.name));
    const orderKey = {};
    sortedByName.forEach((p, i) => {
        orderKey[p.id] = Number.isFinite(p.order) ? p.order : i;
    });

    const maxLevel = Math.max(0, ...people.map(p => p.level || 0));

    // On remonte des feuilles vers la racine : la position d'un parent
    // est influencée par la position moyenne de ses enfants,
    // ce qui aligne sa ligne de liaison avec sa vraie descendance
    // au lieu d'un ordre alphabétique arbitraire.
    for (let lvl = maxLevel; lvl >= 0; lvl--) {
        const contributions = {};

        families.forEach(f => {
            if (!f.parents.length || !f.children.length) return;
            const relevantChildren = f.children.filter(id => (byId[id]?.level ?? 0) >= lvl);
            if (!relevantChildren.length) return;

            const avg = relevantChildren.reduce((s, id) => s + orderKey[id], 0) / relevantChildren.length;

            f.parents.forEach(pid => {
                if (!contributions[pid]) contributions[pid] = [];
                contributions[pid].push(avg);
            });
        });

        Object.entries(contributions).forEach(([pid, values]) => {
            if ((byId[pid]?.level ?? 0) === lvl) {
                orderKey[pid] = values.reduce((s, v) => s + v, 0) / values.length;
            }
        });

        // Les couples gardent une clé proche pour rester groupés dans le tri.
        relations.filter(r => r.type === 'love').forEach(r => {
            if (orderKey[r.a] === undefined || orderKey[r.b] === undefined) return;
            if ((byId[r.a]?.level ?? 0) !== lvl && (byId[r.b]?.level ?? 0) !== lvl) return;
            const avg = (orderKey[r.a] + orderKey[r.b]) / 2;
            orderKey[r.a] = avg;
            orderKey[r.b] = avg;
        });
    }

    people.forEach(p => { p.sortKey = orderKey[p.id]; });
}
function computeAutoLayout() {
    computeLevels();
    computeSubtreeOrder();

    const yGap = 215;
    const coupleGap = 145;
    const blockGap = 115;
    const itemGap = 58;
    const singleWidth = 155;
    const marginX = 180;
    const marginY = 105;
    const baseWidth = Math.max(1250, people.length * 105);

    const groups = new Map();
    people.forEach(p => {
        const level = p.level || 0;
        if (!groups.has(level)) groups.set(level, []);
        groups.get(level).push(p);
    });

    const lovePairs = relations.filter(r => r.type === 'love');
    const levels = [...groups.keys()].sort((a, b) => a - b);

    levels.forEach(level => {
        const members = groups.get(level);
        const memberIds = new Set(members.map(p => p.id));
        const paired = new Set();
        const items = [];

        lovePairs.forEach(pair => {
            if (
                memberIds.has(pair.a) &&
                memberIds.has(pair.b) &&
                !paired.has(pair.a) &&
                !paired.has(pair.b)
            ) {
                const a = byId[pair.a];
                const b = byId[pair.b];
                const anchored = getAnchoredMemberForCouple(a, b);

                items.push({
                    type: 'couple',
                    people: [a, b],
                    width: coupleGap,
                    visualWidth: coupleGap + 125,
                    anchor: getItemAnchor([a, b], level),
                    anchoredId: anchored ? anchored.id : null,
                    familyKey: getFamilyKeyForItem([a, b])
                });

                paired.add(pair.a);
                paired.add(pair.b);
            }
        });

        members.forEach(p => {
            if (!paired.has(p.id)) {
                items.push({
                    type: 'single',
                    people: [p],
                    width: singleWidth,
                    visualWidth: singleWidth,
                    anchor: getItemAnchor([p], level),
                    anchoredId: p.id,
                    familyKey: getFamilyKeyForItem([p])
                });
            }
        });

        items.sort((a, b) => a.anchor - b.anchor || a.people[0].name.localeCompare(b.people[0].name));

        if (level === levels[0]) {
            const totalWidth = items.reduce((sum, item) => sum + item.visualWidth, 0) + Math.max(0, items.length - 1) * blockGap;
            let cursor = marginX + Math.max(0, (baseWidth - totalWidth) / 2);

            items.forEach(item => {
                placeItem(item, cursor, marginY + level * yGap, coupleGap);
                cursor += item.visualWidth + blockGap;
            });
            return;
        }

        const familyGroups = [];
        const familyMap = new Map();

        items.forEach(item => {
            const key = item.familyKey || `solo:${item.people.map(p => p.id).join('-')}`;
            if (!familyMap.has(key)) {
                familyMap.set(key, {
                    key,
                    items: [],
                    anchor: item.familyKey ? getFamilyAnchorByKey(item.familyKey) : item.anchor
                });
                familyGroups.push(familyMap.get(key));
            }
            familyMap.get(key).items.push(item);
        });

        familyGroups.sort((a, b) => a.anchor - b.anchor);

        let previousRight = marginX - blockGap;

        familyGroups.forEach(group => {
            group.items.sort((a, b) => a.anchor - b.anchor || a.people[0].name.localeCompare(b.people[0].name));

            const lefts = [];
            let cursor = 0;

            // Placement interne robuste : chaque bloc a sa vraie largeur visuelle.
            // Ça empêche un couple amoureux de se superposer avec un enfant/frère/sœur.
            group.items.forEach((item, index) => {
                if (index === 0) {
                    lefts[index] = 0;
                    cursor = item.visualWidth + itemGap;
                } else {
                    lefts[index] = cursor;
                    cursor += item.visualWidth + itemGap;
                }
            });

            const rawLeft = Math.min(...lefts);
            const rawRight = Math.max(...group.items.map((item, index) => lefts[index] + item.visualWidth));
            const rawWidth = rawRight - rawLeft;

            // Centre le groupe complet sous le parent/référent.
            let groupLeft = group.anchor - rawWidth / 2;
            if (groupLeft < previousRight + blockGap) {
                groupLeft = previousRight + blockGap;
            }

            group.items.forEach((item, index) => {
                placeItem(item, groupLeft + lefts[index], marginY + level * yGap, coupleGap);
            });

            previousRight = groupLeft + rawWidth;
        });
    });

    normalizeTreeX();

    const maxX = Math.max(...people.map(p => p.x), 1250) + 280;
    const maxY = Math.max(...people.map(p => p.y), 900) + 220;

    tree.style.width = maxX + 'px';
    tree.style.height = maxY + 'px';
    svg.setAttribute('width', maxX);
    svg.setAttribute('height', maxY);
    svg.style.width = maxX + 'px';
    svg.style.height = maxY + 'px';
}

function normalizeTreeX() {
    const minX = Math.min(...people.map(p => p.x), 0);
    if (minX < 120) {
        const shift = 120 - minX;
        people.forEach(p => p.x += shift);
    }
}

function getFamilyKeyForItem(members) {
    const child = members.find(member => families.some(f => f.children.includes(member.id)));
    if (!child) return null;
    const familyIndex = families.findIndex(f => f.children.includes(child.id));
    return familyIndex >= 0 ? `family:${familyIndex}` : null;
}

function getFamilyAnchorByKey(key) {
    const index = Number(String(key).replace('family:', ''));
    const family = families[index];
    if (!family) return 400;

    const parents = family.parents.map(id => byId[id]).filter(p => p && Number.isFinite(p.x));
    if (!parents.length) return 400;

    return parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
}

function hasParents(member) {
    return families.some(f => f.children.includes(member.id));
}

function getAnchoredMemberForCouple(a, b) {
    const aHasParents = hasParents(a);
    const bHasParents = hasParents(b);

    if (aHasParents && !bHasParents) return a;
    if (bHasParents && !aHasParents) return b;

    return null;
}

function getRepresentativeOffset(item, coupleGap) {
    if (item.type === 'single') return item.width / 2;

    if (item.type === 'couple' && item.anchoredId) {
        const anchoredIndex = item.people.findIndex(p => p.id === item.anchoredId);
        return anchoredIndex === 0 ? 0 : coupleGap;
    }

    return item.width / 2;
}

function placeItem(item, left, y, coupleGap) {
    if (item.type === 'couple') {
        item.people[0].x = left;
        item.people[1].x = left + coupleGap;
        item.people[0].y = item.people[1].y = y;
        return;
    }

    item.people[0].x = left + item.width / 2;
    item.people[0].y = y;
}

function getItemAnchor(members, level) {
    const parentAnchors = members.map(member => {
        const family = families.find(f => f.children.includes(member.id));
        if (!family) return null;

        const parentNodes = family.parents.map(id => byId[id]).filter(Boolean);
        const placedParents = parentNodes.filter(p => Number.isFinite(p.x));

        if (!placedParents.length) return null;

        return placedParents.reduce((sum, p) => sum + p.x, 0) / placedParents.length;
    }).filter(v => Number.isFinite(v));

    if (parentAnchors.length) {
        return parentAnchors.reduce((sum, v) => sum + v, 0) / parentAnchors.length;
    }

    const explicit = members.map(p => p.order).filter(v => Number.isFinite(v));
    if (explicit.length) {
        return 250 + (explicit.reduce((s, v) => s + v, 0) / explicit.length) * 155;
    }

    // NOUVEAU : fallback basé sur la position moyenne des descendants
    // au lieu d'un tri purement alphabétique.
    const sortKeys = members.map(p => p.sortKey).filter(Number.isFinite);
    if (sortKeys.length) {
        return 250 + (sortKeys.reduce((s, v) => s + v, 0) / sortKeys.length) * 155;
    }

    return 250 + level * 180 + members[0].name.charCodeAt(0);
}

function getSortValue(...members) {
    const explicit = members.map(p => p.order).filter(v => Number.isFinite(v));
    if (explicit.length) return explicit.reduce((s, v) => s + v, 0) / explicit.length;

    const parentScores = members.map(member => {
        const parentFamily = families.find(f => f.children.includes(member.id));
        if (!parentFamily) return (member.level || 0) * 1000;
        const parentXs = parentFamily.parents.map(id => byId[id]?.x).filter(v => Number.isFinite(v));
        return parentXs.length ? parentXs.reduce((s, v) => s + v, 0) / parentXs.length : (member.level || 0) * 1000;
    });
    return parentScores.reduce((s, v) => s + v, 0) / parentScores.length;
}

function parentPoint(ids) {
    const nodes = ids.map(id => byId[id]).filter(Boolean);
    const centerX = nodes.reduce((s, p) => s + p.x, 0) / nodes.length;

    if (nodes.length >= 2) {
        const sameLevel = nodes.every(p => p.level === nodes[0].level);
        if (sameLevel) return { x: centerX, y: nodes[0].y };
    }

    return { x: centerX, y: Math.max(...nodes.map(p => p.y)) + 51 };
}

function childTop(id) { const p = byId[id]; return { x: p.x, y: p.y - 51 }; }
function isPersonVisible(id) { return !!byId[id]; }

function familyPath(f) {
    const visibleChildren = f.children
        .filter(isPersonVisible)
        .map(childTop)
        .sort((a, b) => a.x - b.x);

    const visibleParents = f.parents.filter(isPersonVisible);
    if (!visibleChildren.length || !visibleParents.length) return '';

    const start = parentPoint(visibleParents);
    const childrenX = visibleChildren.map(c => c.x);
    const childrenCenterX = childrenX.reduce((sum, x) => sum + x, 0) / childrenX.length;

    const firstChildY = Math.min(...visibleChildren.map(c => c.y));

    // Un seul enfant : ligne aussi droite que possible.
    // Si l'enfant est décalé à cause d'un partenaire, on fait un petit coude propre,
    // mais seulement entre les générations, pas à travers les avatars.
    if (visibleChildren.length === 1) {
        const child = visibleChildren[0];
        const midY = start.y + Math.max(62, (child.y - start.y) * 0.45);

        if (Math.abs(start.x - child.x) < 2) {
            return `M${start.x},${start.y} V${child.y}`;
        }

        return `M${start.x},${start.y} V${midY} H${child.x} V${child.y}`;
    }

    // Plusieurs enfants : tronc vertical centré, barre horizontale, puis descentes.
    const junctionY = start.y + Math.max(62, (firstChildY - start.y) * 0.45);
    const minX = Math.min(...childrenX);
    const maxX = Math.max(...childrenX);

    let d = `M${start.x},${start.y} V${junctionY}`;

    if (Math.abs(start.x - childrenCenterX) > 2) {
        d += ` H${childrenCenterX}`;
    }

    d += ` M${minX},${junctionY} H${maxX}`;
    visibleChildren.forEach(c => d += ` M${c.x},${junctionY} V${c.y}`);

    return d;
}

function loveLine(a, b) {
    const p1 = byId[a];
    const p2 = byId[b];
    const left = p1.x < p2.x ? p1 : p2;
    const right = p1.x < p2.x ? p2 : p1;
    const x1 = left.x + 56;
    const x2 = right.x - 56;
    const y = (left.y + right.y) / 2;
    return { x1, x2, y, midX: (x1 + x2) / 2, midY: y };
}

function smartCurve(a, b, offset = 0) {
    const p1 = byId[a], p2 = byId[b];
    const left = p1.x < p2.x ? p1 : p2;
    const right = p1.x < p2.x ? p2 : p1;

    // Divorce/ex : route propre, séparée des avatars et des liens amoureux.
    // Même génération = arc horizontal au-dessus des profils.
    if (p1.gen === p2.gen) {
        const y = Math.min(p1.y, p2.y) - 76 - offset;
        const x1 = left.x + 56;
        const x2 = right.x - 56;
        const lift = Math.min(90, Math.max(38, Math.abs(x2 - x1) * 0.12));
        return `M${x1},${y} C${x1},${y - lift} ${x2},${y - lift} ${x2},${y}`;
    }

    // Générations différentes = courbe latérale pour éviter de traverser l’arbre.
    const direction = p1.x < p2.x ? 1 : -1;
    const x1 = p1.x + direction * 54;
    const x2 = p2.x - direction * 54;
    const midY = (p1.y + p2.y) / 2;
    const side = Math.max(p1.x, p2.x) + 120;
    return `M${x1},${p1.y} C${side},${p1.y} ${side},${p2.y} ${x2},${p2.y}`;
}

function midpoint(a, b) {
    const p1 = byId[a], p2 = byId[b];
    const left = p1.x < p2.x ? p1 : p2;
    const right = p1.x < p2.x ? p2 : p1;

    if (p1.gen === p2.gen) {
        return { x: (left.x + right.x) / 2, y: Math.min(p1.y, p2.y) - 96 };
    }

    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function renderTree() {
    tree.querySelectorAll('.person,.generation-label,.generation-guide').forEach(n => n.remove());
    svg.innerHTML = '';
    const showFamily = document.getElementById('showFamily').checked;
    const showLove = document.getElementById('showLove').checked;
    const visiblePeople = people.filter(p => isPersonVisible(p.id));

    if (showFamily) families.forEach(f => {
        const d = familyPath(f);
        if (!d) return;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'family-line relation family-relation');
        path.dataset.ids = [...f.parents, ...f.children].join(',');
        svg.appendChild(path);
    });

    relations.forEach((r, index) => {
        if (!isPersonVisible(r.a) || !isPersonVisible(r.b)) return;

        if (r.type === 'love' && showLove) {
            const l = loveLine(r.a, r.b);
            if (l.x2 > l.x1) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', l.x1);
                line.setAttribute('x2', l.x2);
                line.setAttribute('y1', l.y);
                line.setAttribute('y2', l.y);
                line.setAttribute('class', 'love-line relation');
                line.dataset.ids = `${r.a},${r.b}`;
                svg.appendChild(line);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', l.midX - 8);
                text.setAttribute('y', l.midY + 6);
                text.setAttribute('class', 'love-heart relation');
                text.dataset.ids = `${r.a},${r.b}`;
                text.textContent = '♥';
                svg.appendChild(text);
            }
        }


    });

    visiblePeople.forEach(p => {
        const el = document.createElement('div');
        el.className = `person gen-${p.gen}`;
        el.dataset.id = p.id;
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        const avatar = p.resolvedImg || p.img || NEUTRAL_IMG;
        el.innerHTML = `<div class="avatar-ring ${p.gender}"><img id="avatar-${p.id}" src="${avatar}" alt="${p.name}"></div><div class="name">${p.name}</div><div class="dates">${p.dates || ''}</div>`;
        el.onclick = (event) => { event.stopPropagation(); selectPerson(p.id, true); };
        tree.appendChild(el);
        const img = el.querySelector('img');
        img.onload = () => img.classList.add('loaded');
        if (img.complete) img.classList.add('loaded');
    });

    document.getElementById('statPeople').textContent = people.length;
    document.getElementById('statRelations').textContent = relations.filter(r => r.type !== 'divorce').length;
    if (selectedId && isPersonVisible(selectedId)) selectPerson(selectedId, false);
}

function relationIdsFromElement(el) { return new Set((el.dataset.ids || '').split(',').filter(Boolean)); }

function selectPerson(id, open = true) {
    selectedId = id;
    document.querySelectorAll('.person').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
        el.classList.remove('search-match');
    });
    document.querySelectorAll('.relation').forEach(el => {
        const related = relationIdsFromElement(el).has(id);
        el.classList.toggle('selected-link', related);
    });
    if (open) openModal(byId[id]);
}

function searchPeople() {
    selectedId = null;
    const q = document.getElementById('familySearch').value.trim().toLowerCase();
    document.querySelectorAll('.person').forEach(el => {
        const p = byId[el.dataset.id];
        const match = !!q && (p.name.toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q));
        el.classList.toggle('search-match', match);
        el.classList.remove('selected');
    });
    document.querySelectorAll('.relation').forEach(el => el.classList.remove('selected-link'));
    const first = people.find(p => isPersonVisible(p.id) && (p.name.toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q)));
    if (q && first) centerOn(first.id);
}

function clearSelection(closePopup = true) {
    selectedId = null;
    document.querySelectorAll('.person').forEach(el => el.classList.remove('selected', 'search-match'));
    document.querySelectorAll('.relation').forEach(el => el.classList.remove('selected-link'));
    if (closePopup) document.getElementById('personModal').style.display = 'none';
}


function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseInlineMarkdown(text) {
    let html = escapeHtml(text);

    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return html;
}

function markdownToHtml(markdown) {
    let source = String(markdown || '');

    // Accepte plusieurs façons d'écrire un saut de ligne dans family-data.json :
    // 1) "ligne 1\nligne 2"
    // 2) "ligne 1\\nligne 2"
    // 3) "ligne 1<br>ligne 2"
    source = source
        .replace(/\r\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .trim();

    if (!source) return `<p>${t('family_no_profile_info', 'Aucune information disponible.')}</p>`;

    const blocks = source.split(/\n{2,}/);
    const htmlBlocks = [];

    blocks.forEach(block => {
        const lines = block.split('\n');

        if (lines.every(line => line.trim().startsWith('>'))) {
            const content = lines
                .map(line => line.replace(/^>\s?/, ''))
                .join('<br>');
            htmlBlocks.push(`<blockquote>${parseInlineMarkdown(content)}</blockquote>`);
            return;
        }

        if (lines.every(line => /^\s*[-*]\s+/.test(line))) {
            const items = lines
                .map(line => line.replace(/^\s*[-*]\s+/, ''))
                .map(line => `<li>${parseInlineMarkdown(line)}</li>`)
                .join('');
            htmlBlocks.push(`<ul>${items}</ul>`);
            return;
        }

        if (lines.every(line => /^\s*\d+\.\s+/.test(line))) {
            const items = lines
                .map(line => line.replace(/^\s*\d+\.\s+/, ''))
                .map(line => `<li>${parseInlineMarkdown(line)}</li>`)
                .join('');
            htmlBlocks.push(`<ol>${items}</ol>`);
            return;
        }

        // Sauts simples conservés
        htmlBlocks.push(`<p>${lines.map(parseInlineMarkdown).join('<br>')}</p>`);
    });

    return htmlBlocks.join('');
}

function openModal(p) {
    document.getElementById('modalImg').src = p.resolvedImg || p.img || NEUTRAL_IMG;
    document.getElementById('modalName').textContent = p.name;
    document.getElementById('modalMeta').textContent = `${p.role || t('family_member', 'Membre')} · ${t('family_level', 'Niveau')} ${Number.isFinite(p.level) ? p.level + 1 : 1}${p.dates ? ' · ' + p.dates : ''}`;
    document.getElementById('modalInfo').innerHTML = markdownToHtml(p.bio);
    const tags = relations.filter(r => r.a === p.id || r.b === p.id).map(r => {
        const other = byId[r.a === p.id ? r.b : r.a];
        return `<span class="pill">${r.labelKey ? t(r.labelKey, r.label || r.type) : (r.label || r.type)} : ${other?.name || t('family_unknown', 'Inconnu')}</span>`;
    });
    const familyTags = families.filter(f => f.parents.includes(p.id) || f.children.includes(p.id)).map(f =>
        f.parents.includes(p.id)
            ? `<span class="pill">${t('family_parent_of', 'Parent de')} ${f.children.length} ${t('family_children_count', 'enfant(s)')}</span>`
            : `<span class="pill">${t('family_child_of', 'Enfant de')} ${f.parents.map(id => byId[id]?.name).join(' & ')}</span>`
    );
    document.getElementById('modalTags').innerHTML = [...tags, ...familyTags].join('') || `<span class="pill">${t('family_no_relation', 'Aucune relation renseignée')}</span>`;
    const socials = p.socials || {};
    document.getElementById('modalSocials').innerHTML = Object.entries(socials).map(([name, url]) => `<a class="social-link" href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('') || `<span class="pill">${t('family_no_social', 'Aucun réseau renseigné')}</span>`;
    document.getElementById('personModal').style.display = 'flex';
}


function getTreeBounds() {
    const visiblePeople = people.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!visiblePeople.length) return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };

    const paddingX = 150;
    const paddingY = 150;

    const minX = Math.min(...visiblePeople.map(p => p.x)) - paddingX;
    const maxX = Math.max(...visiblePeople.map(p => p.x)) + paddingX;
    const minY = Math.min(...visiblePeople.map(p => p.y)) - paddingY;
    const maxY = Math.max(...visiblePeople.map(p => p.y)) + paddingY;

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function fitTreeToView() {
    const bounds = getTreeBounds();

    const scaleX = stage.clientWidth / bounds.width;
    const scaleY = stage.clientHeight / bounds.height;

    zoom = Math.max(0.35, Math.min(1.15, Math.min(scaleX, scaleY)));

    panX = (stage.clientWidth - bounds.width * zoom) / 2 - bounds.minX * zoom;
    panY = (stage.clientHeight - bounds.height * zoom) / 2 - bounds.minY * zoom;

    applyTransform();
}

function closeModal(e) { if (!e || e.target.id === 'personModal') document.getElementById('personModal').style.display = 'none'; }
function zoomBy(multiplier) { zoom = Math.max(.35, Math.min(2.2, zoom * multiplier)); applyTransform(); }
function centerTree() { fitTreeToView(); }
function centerOn(id) {
    const p = byId[id];
    if (!p) return;
    zoom = Math.max(1.25, Math.min(1.55, zoom));
    panX = stage.clientWidth / 2 - p.x * zoom;
    panY = stage.clientHeight / 2 - p.y * zoom;
    applyTransform();
}
function centerOnSelected() { if (selectedId) centerOn(selectedId); }

function resetView() {
    zoom = 1; selectedId = null;
    document.getElementById('familySearch').value = ''; renderTree();
    fitTreeToView();
}

function togglePanel() { const panel = document.getElementById('familyPanel'), button = document.getElementById('panelToggle'); panel.classList.toggle('collapsed'); button.textContent = panel.classList.contains('collapsed') ? '›' : '‹'; }
function toggleFullscreen() { const app = document.getElementById('familyApp'); if (!document.fullscreenElement) app.requestFullscreen?.(); else document.exitFullscreen?.(); }

async function resolveDiscordAvatars() {
    const discordIds = people.filter(p => p.discordId).map(p => p.discordId);
    if (!discordIds.length) return;
    try {
        const res = await fetch(`${WORKER_URL}?guild=${GUILD_ID}&ids=${discordIds.join(',')}`);
        const avatarMap = await res.json();
        people.forEach(p => {
            if (p.discordId && avatarMap[p.discordId]) p.resolvedImg = avatarMap[p.discordId];
        });
    } catch (err) {
        console.error('Erreur de chargement des PP Discord:', err);
    }
}

async function loadFamilyData() {
    try {
        const response = await fetch(FAMILY_DATA_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Fichier introuvable');
        const data = await response.json();
        people = data.people || [];
        families = data.families || [];
        relations = data.relations || [];
        byId = Object.fromEntries(people.map(p => [p.id, p]));
        computeAutoLayout();
        await resolveDiscordAvatars(); renderTree();
        renderTree();

        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const profileId = params.get('profile');

            if (profileId && byId[profileId]) {
                selectPerson(profileId, true);
                centerOn(profileId);
            } else {
                fitTreeToView();
            }
        }, 150);
    } catch (error) {
        console.error('Erreur chargement family-data.json :', error);
        tree.innerHTML = `<p style="color:white;padding:40px">${t('family_data_load_error', 'Impossible de charger')} <strong>family-data.json</strong>. ${t('family_data_load_error_hint', 'Vérifie que le fichier est bien à la racine du site.')}</p><svg class="relations" id="relationsSvg"></svg>`;
    }
}
loadFamilyData();
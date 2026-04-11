import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ticketsFile = join(__dirname, '..', 'data', 'tickets.json');

let tickets = { guilds: {} };

function getGuildTickets(guildId) {
    if (!tickets.guilds[guildId]) {
        tickets.guilds[guildId] = {
            counter: 0,
            channels: {}
        };
    }

    if (typeof tickets.guilds[guildId].counter !== 'number') {
        tickets.guilds[guildId].counter = 0;
    }

    if (!tickets.guilds[guildId].channels) {
        tickets.guilds[guildId].channels = {};
    }

    return tickets.guilds[guildId];
}

export function loadTickets() {
    try {
        if (existsSync(ticketsFile)) {
            tickets = JSON.parse(readFileSync(ticketsFile, 'utf-8'));
        } else {
            saveTickets();
        }
    } catch {
        tickets = { guilds: {} };
        saveTickets();
    }

    if (!tickets.guilds) {
        tickets = { guilds: {} };
        saveTickets();
    }

    return tickets;
}

function saveTickets() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));
    } catch (error) {
        console.error('Error guardando tickets:', error);
    }
}

export function getNextTicketNumber(guildId) {
    const guildTickets = getGuildTickets(guildId);
    guildTickets.counter += 1;
    saveTickets();
    return guildTickets.counter;
}

export function createTicketRecord(guildId, channelId, data) {
    const guildTickets = getGuildTickets(guildId);
    guildTickets.channels[channelId] = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        participants: Array.isArray(data.participants) ? data.participants : []
    };
    saveTickets();
    return guildTickets.channels[channelId];
}

export function getTicketRecord(guildId, channelId) {
    return getGuildTickets(guildId).channels[channelId] || null;
}

export function updateTicketRecord(guildId, channelId, updates) {
    const guildTickets = getGuildTickets(guildId);
    const current = guildTickets.channels[channelId];

    if (!current) return null;

    guildTickets.channels[channelId] = {
        ...current,
        ...updates
    };

    saveTickets();
    return guildTickets.channels[channelId];
}

export function deleteTicketRecord(guildId, channelId) {
    const guildTickets = getGuildTickets(guildId);
    const current = guildTickets.channels[channelId];

    if (!current) return null;

    delete guildTickets.channels[channelId];
    saveTickets();
    return current;
}

export function getOpenTicketsByOwner(guildId, ownerId) {
    return Object.entries(getGuildTickets(guildId).channels)
        .filter(([, ticket]) => ticket.ownerId === ownerId)
        .map(([channelId, ticket]) => ({ channelId, ...ticket }));
}

export function getOpenTicketCount(guildId) {
    return Object.keys(getGuildTickets(guildId).channels).length;
}

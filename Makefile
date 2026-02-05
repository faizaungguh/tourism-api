import-admin:
	node data/seeds/seeding.mjs --import-admin

import-default:
	node data/seeds/seeding.mjs --import-data

import-destination:
	node data/seeds/seeding.mjs --import-destination

import-ticket-destination:
	node data/seeds/seeding.mjs --import-ticket-destination

import-attraction:
	node data/seeds/seeding.mjs --import-attraction

delete-attraction:
	node data/seeds/seeding.mjs --delete-attraction

delete-ticket-destination:
	node data/seeds/seeding.mjs --delete-ticket-destination

delete-destination:
	node data/seeds/seeding.mjs --delete-destination

delete-admin:
	node data/seeds/seeding.mjs --delete-admin

delete-data:
	node data/seeds/seeding.mjs --delete-admin
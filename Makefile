import-admin:
	node data/seeds/seeding.mjs --import-admin

import-default:
	node data/seeds/seeding.mjs --import-data

import-destination:
	node data/seeds/seeding.mjs --import-destination

delete-destination:
	node data/seeds/seeding.mjs --delete-destination

delete-admin:
	node data/seeds/seeding.mjs --delete-admin

delete-data:
	node data/seeds/seeding.mjs --delete-admin
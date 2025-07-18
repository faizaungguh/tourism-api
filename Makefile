import-admin:
	node data/seeds/seeds.mjs --import-admin

delete-admin:
	node data/seeds/seeds.mjs --delete-admin

import-default:
	node data/seeds/seeds.mjs --import-default

delete-default:
	node data/seeds/seeds.mjs --delete-default

import-all:
	node data/seeds/seeds.mjs --import-all

delete-all:
	node data/seeds/seeds.mjs --delete-all

dev-default:
	node data/seeds/seeds.mjs --delete-all && node data/seeds/seeds.mjs --import-all
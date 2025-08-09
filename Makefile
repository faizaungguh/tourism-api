import-admin:
	node data/seeds/seeds.mjs --import-admin

import-default:
	node data/seeds/seeds.mjs --import-default

import-all:
	node data/seeds/seeds.mjs --import-all

import-tourist-data:
	node data/seeds/seeds.mjs --import-tourist

delete-tourist-data:
	node data/seeds/seeds.mjs --delete-tourist

delete-admin:
	node data/seeds/seeds.mjs --delete-admin

delete-default:
	node data/seeds/seeds.mjs --delete-default

delete-all:
	node data/seeds/seeds.mjs --delete-all && rm -rf public/images

dev-default:
	node data/seeds/seeds.mjs --delete-all && node data/seeds/seeds.mjs --import-all
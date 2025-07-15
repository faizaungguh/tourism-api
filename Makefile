import-admin:
	node data/seeds/seeds.mjs --import-admin

import-data:
	node data/seeds/seeds.mjs --import-default

delete-admin:
	node data/seeds/seeds.mjs --delete-admin
	
delete-data:
	node data/seeds/seeds.mjs --delete-default
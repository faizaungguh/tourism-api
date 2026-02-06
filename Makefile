#? ADMIN
import-admin:
	node data/seeds/seeding.mjs --import-admin
delete-admin:
	node data/seeds/seeding.mjs --delete-admin

#? DEFAULT
import-default:
	node data/seeds/seeding.mjs --import-default

#? DESTINATION
import-destination:
	node data/seeds/seeding.mjs --import-destination
delete-destination:
	node data/seeds/seeding.mjs --delete-destination

#? TIKET DESTINATION
import-ticket-destination:
	node data/seeds/seeding.mjs --import-ticket-destination
delete-ticket-destination:
	node data/seeds/seeding.mjs --delete-ticket-destination

#? ATTRACTION
import-attraction:
	node data/seeds/seeding.mjs --import-attraction
delete-attraction:
	node data/seeds/seeding.mjs --delete-attraction

#? FACILITY
import-facility:
	node data/seeds/seeding.mjs --import-facility
delete-facility:
	node data/seeds/seeding.mjs --delete-facility

#? PARKING
import-parking:
	node data/seeds/seeding.mjs --import-parking
delete-parking:
	node data/seeds/seeding.mjs --delete-parking

#? CONTACT 
import-contact:
	node data/seeds/seeding.mjs --import-contact
delete-contact:
	node data/seeds/seeding.mjs --delete-contact

#? FULLPACK 
import-fullpack:
	node data/seeds/seeding.mjs --import-fullpack
	
delete-data:
	node data/seeds/seeding.mjs --delete-all

.DEFAULT:
	@echo "Perintah tidak valid. Target '$@' tidak ditemukan."
	@exit 1
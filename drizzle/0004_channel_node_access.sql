CREATE TABLE "room_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"granted_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_players" ADD COLUMN "access" text DEFAULT 'members' NOT NULL;
--> statement-breakpoint
ALTER TABLE "room_nodes" ADD CONSTRAINT "room_nodes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_nodes" ADD CONSTRAINT "room_nodes_node_id_livekit_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."livekit_nodes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_nodes" ADD CONSTRAINT "room_nodes_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "node_access_grants" ADD CONSTRAINT "node_access_grants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "node_access_grants" ADD CONSTRAINT "node_access_grants_node_id_livekit_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."livekit_nodes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "node_access_grants" ADD CONSTRAINT "node_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "node_access_grants" ADD CONSTRAINT "node_access_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_nodes_room_node_idx" ON "room_nodes" USING btree ("room_id","node_id");
--> statement-breakpoint
CREATE INDEX "room_nodes_room_idx" ON "room_nodes" USING btree ("room_id");
--> statement-breakpoint
CREATE INDEX "room_nodes_node_idx" ON "room_nodes" USING btree ("node_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "node_access_grants_unique_idx" ON "node_access_grants" USING btree ("room_id","node_id","user_id");
--> statement-breakpoint
CREATE INDEX "node_access_grants_room_user_idx" ON "node_access_grants" USING btree ("room_id","user_id");

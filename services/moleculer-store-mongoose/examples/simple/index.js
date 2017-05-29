"use strict";

let chalk = require("chalk");
let { ServiceBroker } = require("moleculer");
let StoreService = require("../../../moleculer-store/index");
let MongooseAdapter = require("../../index");
let Post = require("../models/posts");

// Create broker
let broker = new ServiceBroker({
	logger: console,
	logLevel: "debug"
});

// Load my service
broker.createService(StoreService, {
	name: "posts",
	adapter: new MongooseAdapter("mongodb://localhost/moleculer-store-demo"),
	collection: Post,
	settings: {
		propertyFilter: "_id title content votes"
	},

	actions: {
		vote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.adapter.updateById(ctx.params.id, { $inc: { votes: 1 } }))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));		
		},

		unvote(ctx) {
			return this.Promise.resolve(ctx)
				.then(ctx => this.adapter.updateById(ctx.params.id, { $inc: { votes: -1 } }))
				.then(docs => this.transformDocuments(ctx, docs))
				.then(json => this.clearCache().then(() => json));		
		}
	},

	afterConnected() {
		this.logger.info(chalk.green.bold("Connected successfully"));
	}
});

// Start server
broker.start().delay(500).then(() => {
	let id;
	Promise.resolve()
		// Drop all posts
		.then(() => console.log(chalk.yellow.bold("\n--- CLEAR ---")))
		.then(() => broker.call("posts.clear").then(console.log))

		// Count of posts
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT ---")))
		.then(() => broker.call("posts.count").then(console.log))
		
		// Create new Posts
		.then(() => console.log(chalk.yellow.bold("\n--- CREATE ---")))
		.then(() => broker.call("posts.create", { entity: { title: "Hello", content: "Post content", votes: 0, author: null } })
			.then(doc => {
				id = doc._id;
				console.log("Saved: ", doc);
			})
		)

		// List posts
		.then(() => console.log(chalk.yellow.bold("\n--- FIND ---")))
		.then(() => broker.call("posts.find").then(console.log))

		// Get a post
		.then(() => console.log(chalk.yellow.bold("\n--- GET ---")))
		.then(() => broker.call("posts.get", { id }).then(console.log))

		// Vote a post
		.then(() => console.log(chalk.yellow.bold("\n--- VOTE ---")))
		.then(() => broker.call("posts.vote", { 
			id
		}).then(console.log))

		// Update a posts
		.then(() => console.log(chalk.yellow.bold("\n--- UPDATE ---")))
		.then(() => broker.call("posts.update", { 
			id, 
			update: { 
				$set: { 
					title: "Hello 2", 
					content: "Post content 2",
					updatedAt: new Date()
				} 
			} 
		}).then(console.log))

		// Get a post
		.then(() => console.log(chalk.yellow.bold("\n--- GET ---")))
		.then(() => broker.call("posts.get", { id }).then(console.log))

		// Unvote a post
		.then(() => console.log(chalk.yellow.bold("\n--- UNVOTE ---")))
		.then(() => broker.call("posts.unvote", { 
			id
		}).then(console.log))
		
		// Count of posts
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT ---")))
		.then(() => broker.call("posts.count").then(console.log))
		
		// Remove a post
		.then(() => console.log(chalk.yellow.bold("\n--- REMOVE ---")))
		.then(() => broker.call("posts.remove", { id }).then(console.log))

		// Count of posts
		.then(() => console.log(chalk.yellow.bold("\n--- COUNT ---")))
		.then(() => broker.call("posts.count").then(console.log))

		// Error handling
		.catch(console.error)

		// Stop
		.then(() => broker.stop());


});
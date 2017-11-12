"use strict";

const { ServiceBroker, Context } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const DbService = require("../../src");
//const lolex = require("lolex");

function protectReject(err) {
	if (err && err.stack) {
		console.error(err);
		console.error(err.stack);
	}
	expect(err).toBe(true);
}

describe("Test DbService actions", () => {
	const doc = { id : 1 };
	const docs = [doc];

	const adapter = {
		init: jest.fn(() => Promise.resolve()),
		connect: jest.fn(() => Promise.resolve()),
		disconnect: jest.fn(() => Promise.resolve()),
		find: jest.fn(() => Promise.resolve(docs)),
		findById: jest.fn(() => Promise.resolve(doc)),
		findByIds: jest.fn(() => Promise.resolve(docs)),
		count: jest.fn(() => Promise.resolve(3)),
		insert: jest.fn(() => Promise.resolve(doc)),
		insertMany: jest.fn(() => Promise.resolve(docs)),
		updateMany: jest.fn(() => Promise.resolve(docs)),
		updateById: jest.fn(() => Promise.resolve(doc)),
		removeMany: jest.fn(() => Promise.resolve(5)),
		removeById: jest.fn(() => Promise.resolve(3)),
		clear: jest.fn(() => Promise.resolve(3)),
		entityToObject: jest.fn(obj => obj)
	};

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		adapter,
	});

	service.sanitizeParams = jest.fn((ctx, p) => p);
	service.transformDocuments = jest.fn((ctx, params, docs) => Promise.resolve(docs));

	it("should set default settings", () => {
		expect(service.adapter).toBe(adapter);
		expect(service.settings).toEqual({
			entityValidator: null,
			fields: null,
			idField: "_id",
			maxLimit: -1,
			maxPageSize: 100,
			pageSize: 10,
			populates: null
		});
	});

	it("should called the 'init' method of adapter", () => {
		expect(adapter.init).toHaveBeenCalledTimes(1);
		expect(adapter.init).toHaveBeenCalledWith(broker, service);
	});

	it("should call the 'connect' method", () => {
		service.connect = jest.fn(() => Promise.resolve());

		return broker.start().then(() => {
			expect(service.connect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call the 'find' method", () => {
		service.transformDocuments.mockClear();
		service.sanitizeParams.mockClear();
		const p = {};

		return broker.call("store.find", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(adapter.find).toHaveBeenCalledTimes(1);
			expect(adapter.find).toHaveBeenCalledWith(p);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, docs);

		}).catch(protectReject);
	});

	it("should call the 'find' method with params", () => {
		service.transformDocuments.mockClear();
		adapter.find.mockClear();
		service.sanitizeParams.mockClear();
		const p = {
			limit: 5,
			offset: "3"
		};

		return broker.call("store.find", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), {
				limit: 5,
				offset: "3"
			});

			expect(adapter.find).toHaveBeenCalledTimes(1);
			expect(adapter.find).toHaveBeenCalledWith({
				limit: 5,
				offset: "3"
			});

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), {
				limit: 5,
				offset: "3"
			}, docs);

		}).catch(protectReject);
	});

	it("should call the 'list' method", () => {
		service.sanitizeParams.mockClear();
		service.transformDocuments.mockClear();
		adapter.find.mockClear();
		adapter.count.mockClear();
		const p = {};

		return broker.call("store.list", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(adapter.find).toHaveBeenCalledTimes(1);
			expect(adapter.count).toHaveBeenCalledTimes(1);
			expect(adapter.find).toHaveBeenCalledWith(p);
			expect(adapter.count).toHaveBeenCalledWith(p);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, docs);
		}).catch(protectReject);
	});

	it("should call the 'count' method", () => {
		service.sanitizeParams.mockClear();
		adapter.count = jest.fn();
		const p = {};

		return broker.call("store.count", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(adapter.count).toHaveBeenCalledTimes(1);
			expect(adapter.count).toHaveBeenCalledWith(p);
		}).catch(protectReject);
	});

	it("should call the 'count' method with pagination params", () => {
		service.sanitizeParams.mockClear();
		adapter.count = jest.fn();
		const p = { limit: 5, offset: 10 };

		return broker.call("store.count", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(adapter.count).toHaveBeenCalledTimes(1);
			expect(adapter.count).toHaveBeenCalledWith({ limit: null, offset: null});
		}).catch(protectReject);
	});

	it("should call the 'insert' method", () => {
		service.sanitizeParams.mockClear();
		service.transformDocuments.mockClear();
		service.entityChanged = jest.fn(() => Promise.resolve());
		service.validateEntity = jest.fn(entity => Promise.resolve(entity));
		adapter.insert.mockClear();
		const p = {};

		return broker.call("store.create", p).then(() => {
			expect(service.validateEntity).toHaveBeenCalledTimes(1);
			expect(service.validateEntity).toHaveBeenCalledWith(p);

			expect(adapter.insert).toHaveBeenCalledTimes(1);
			expect(adapter.insert).toHaveBeenCalledWith(p);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), {}, doc);

			expect(service.entityChanged).toHaveBeenCalledTimes(1);
			expect(service.entityChanged).toHaveBeenCalledWith("created", doc, jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'insert' method #2", () => {
		service.sanitizeParams.mockClear();
		service.transformDocuments.mockClear();
		service.entityChanged = jest.fn(() => Promise.resolve());
		service.validateEntity = jest.fn(entity => Promise.resolve(entity));
		adapter.insert.mockClear();
		const p = {
			entity: {}
		};

		return broker.call("store.insert", p).then(() => {
			expect(service.validateEntity).toHaveBeenCalledTimes(1);
			expect(service.validateEntity).toHaveBeenCalledWith(p.entity);

			expect(adapter.insert).toHaveBeenCalledTimes(1);
			expect(adapter.insert).toHaveBeenCalledWith(p.entity);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, doc);

			expect(service.entityChanged).toHaveBeenCalledTimes(1);
			expect(service.entityChanged).toHaveBeenCalledWith("created", doc, jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'insertMany' method", () => {
		service.sanitizeParams.mockClear();
		service.transformDocuments.mockClear();
		service.entityChanged = jest.fn(() => Promise.resolve());
		service.validateEntity = jest.fn(entity => Promise.resolve(entity));
		adapter.insert.mockClear();
		const p = {
			entities: []
		};

		return broker.call("store.insert", p).then(() => {
			expect(service.validateEntity).toHaveBeenCalledTimes(1);
			expect(service.validateEntity).toHaveBeenCalledWith(p.entities);

			expect(adapter.insertMany).toHaveBeenCalledTimes(1);
			expect(adapter.insertMany).toHaveBeenCalledWith(p.entities);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, docs);

			expect(service.entityChanged).toHaveBeenCalledTimes(1);
			expect(service.entityChanged).toHaveBeenCalledWith("created", docs, jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'getById' method", () => {
		service.sanitizeParams.mockClear();
		service.transformDocuments.mockClear();
		service.getById = jest.fn(() => Promise.resolve(doc));
		const p = { id: 5 };

		return broker.call("store.get", p).then(() => {
			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(service.getById).toHaveBeenCalledTimes(1);
			expect(service.getById).toHaveBeenCalledWith(5, true);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, doc);

		}).catch(protectReject);
	});

	it("should call the 'getById' method with multi IDs, and should convert the result to object", () => {
		service.transformDocuments.mockClear();
		const p = { id: [5, 3, 8], fields: false, mapping: true };

		let docs = [
			{ _id: 5, name: "John" },
			{ _id: 3, name: "Walter" },
			{ _id: 8, name: "Jane" }
		];
		service.getById = jest.fn(() => Promise.resolve(docs));

		return broker.call("store.get", p).then(res => {
			expect(res).toEqual({
				"3": {
					"_id": 3,
					"name": "Walter"
				},
				"5": {
					"_id": 5,
					"name": "John"
				},
				"8": {
					"_id": 8,
					"name": "Jane"
				}
			});

			expect(service.getById).toHaveBeenCalledTimes(1);
			expect(service.getById).toHaveBeenCalledWith([5, 3, 8], true);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, docs);

		}).catch(protectReject);
	});

	it("should call the 'update' method", () => {
		service.sanitizeParams.mockClear();
		service.decodeID = jest.fn(id => id);
		service.transformDocuments.mockClear();
		service.entityChanged.mockClear();
		adapter.updateById.mockClear();
		const p = {
			_id: 123,
			name: "John",
			age: 45
		};

		return broker.call("store.update", p).then(() => {
			expect(service.decodeID).toHaveBeenCalledTimes(1);
			expect(service.decodeID).toHaveBeenCalledWith(123);

			expect(adapter.updateById).toHaveBeenCalledTimes(1);
			expect(adapter.updateById).toHaveBeenCalledWith(123, { "$set": { name: "John", age: 45 }});

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, doc);

			expect(service.entityChanged).toHaveBeenCalledTimes(1);
			expect(service.entityChanged).toHaveBeenCalledWith("updated", doc, jasmine.any(Context));
		}).catch(protectReject);
	});

	it("should call the 'remove' method", () => {
		service.sanitizeParams.mockClear();
		service.decodeID = jest.fn(id => id);
		service.transformDocuments.mockClear();
		service.entityChanged.mockClear();
		adapter.removeById.mockClear();
		const p = { id: 3 };

		return broker.call("store.remove", p).then(() => {
			expect(service.decodeID).toHaveBeenCalledTimes(1);
			expect(service.decodeID).toHaveBeenCalledWith(3);

			expect(service.sanitizeParams).toHaveBeenCalledTimes(1);
			expect(service.sanitizeParams).toHaveBeenCalledWith(jasmine.any(Context), p);

			expect(adapter.removeById).toHaveBeenCalledTimes(1);
			expect(adapter.removeById).toHaveBeenCalledWith(3);

			expect(service.transformDocuments).toHaveBeenCalledTimes(1);
			expect(service.transformDocuments).toHaveBeenCalledWith(jasmine.any(Context), p, 3);

			expect(service.entityChanged).toHaveBeenCalledTimes(1);
			expect(service.entityChanged).toHaveBeenCalledWith("removed", 3, jasmine.any(Context));

		}).catch(protectReject);
	});

	it("should call the 'disconnect' method", () => {
		service.disconnect = jest.fn();

		return broker.stop().then(() => {
			expect(service.disconnect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});
});

describe("Test reconnecting", () => {
	const adapter = {
		init: jest.fn(() => Promise.resolve()),
		connect: jest.fn()
			.mockImplementationOnce(() => Promise.reject("Error"))
			.mockImplementationOnce(() => Promise.resolve()),
		disconnect: jest.fn(() => Promise.resolve())
	};
	const broker = new ServiceBroker();
	const service = broker.createService(DbService, {
		name: "store",
		adapter,
	});

	it("should connect after error", () => {
		return service.schema.started.call(service).catch(protectReject).then(() => {
			expect(adapter.connect).toHaveBeenCalledTimes(2);
		});
	});

});


describe("Test DbService methods", () => {
	const doc = { id : 1 };
	const docs = [doc];

	const adapter = {
		init: jest.fn(() => Promise.resolve()),
		connect: jest.fn(() => Promise.resolve()),
		disconnect: jest.fn(() => Promise.resolve()),
		find: jest.fn(() => Promise.resolve(docs)),
		findById: jest.fn(() => Promise.resolve(doc)),
		findByIds: jest.fn(() => Promise.resolve(docs)),
		count: jest.fn(() => Promise.resolve(3)),
		insert: jest.fn(() => Promise.resolve(doc)),
		insertMany: jest.fn(() => Promise.resolve(docs)),
		updateMany: jest.fn(() => Promise.resolve(docs)),
		updateById: jest.fn(() => Promise.resolve(doc)),
		removeMany: jest.fn(() => Promise.resolve(5)),
		removeById: jest.fn(() => Promise.resolve(3)),
		clear: jest.fn(() => Promise.resolve(3)),
		entityToObject: jest.fn(obj => obj)
	};

	const afterConnected = jest.fn();

	const broker = new ServiceBroker({ validation: false, cacher: true });
	const service = broker.createService(DbService, {
		name: "store",
		adapter,
		afterConnected
	});

	it("should call 'afterConnected' of schema", () => {
		return broker.start().delay(100).then(() => {
			expect(afterConnected).toHaveBeenCalledTimes(1);
			expect(adapter.connect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});

	it("should call broker.broadcast to clear the cache", () => {
		broker.broadcast = jest.fn();
		broker.cacher.clean = jest.fn();

		return service.clearCache().then(() => {
			expect(broker.broadcast).toHaveBeenCalledTimes(1);
			expect(broker.broadcast).toHaveBeenCalledWith("cache.clean.store");

			expect(broker.cacher.clean).toHaveBeenCalledTimes(1);
			expect(broker.cacher.clean).toHaveBeenCalledWith("store.*");
		}).catch(protectReject);
	});

	describe("Test `this.getById` method", () => {
		service.encodeID = jest.fn(id => id);
		service.decodeID = jest.fn(id => id);

		it("call with one ID without encoding", () => {
			adapter.findById.mockClear();

			return service.getById(5).then(res => {
				expect(res).toBe(doc);

				expect(service.decodeID).toHaveBeenCalledTimes(0);

				expect(adapter.findById).toHaveBeenCalledTimes(1);
				expect(adapter.findById).toHaveBeenCalledWith(5);
			}).catch(protectReject);
		});

		it("call with one ID and encoding", () => {
			adapter.findById.mockClear();

			return service.getById(5, true).then(res => {
				expect(res).toBe(doc);

				expect(service.decodeID).toHaveBeenCalledTimes(1);
				expect(service.decodeID).toHaveBeenCalledWith(5);

				expect(adapter.findById).toHaveBeenCalledTimes(1);
				expect(adapter.findById).toHaveBeenCalledWith(5);
			}).catch(protectReject);
		});

		it("call with multi IDs", () => {
			service.encodeID.mockClear();
			service.decodeID.mockClear();
			adapter.findByIds.mockClear();

			return service.getById([5, 3, 8], true).then(res => {
				expect(res).toBe(docs);

				expect(service.decodeID).toHaveBeenCalledTimes(3);
				expect(service.decodeID).toHaveBeenCalledWith(5);
				expect(service.decodeID).toHaveBeenCalledWith(3);
				expect(service.decodeID).toHaveBeenCalledWith(8);

				expect(adapter.findByIds).toHaveBeenCalledTimes(1);
				expect(adapter.findByIds).toHaveBeenCalledWith([5, 3, 8]);

			}).catch(protectReject);
		});

	});

	it("should call 'find' of adapter", () => {
		adapter.find.mockClear();
		let params = {query: { username: "john" }};
		return service.findOne(params).then(res => {
			expect(res).toBe(docs[0]);

			expect(adapter.find).toHaveBeenCalledTimes(1);
			expect(adapter.find).toHaveBeenCalledWith(params);
		}).catch(protectReject);
	});

	it("should call 'disconnect' of adapter", () => {
		return broker.stop().delay(100).then(() => {
			expect(adapter.disconnect).toHaveBeenCalledTimes(1);
		}).catch(protectReject);
	});
});


describe("Test entityChanged method", () => {
	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		settings: {},
		entityCreated: jest.fn(),
		entityUpdated: jest.fn(),
		entityRemoved: jest.fn(),
	});

	service.clearCache = jest.fn(() => Promise.resolve());

	let ctx = {};
	let doc = { id: 5 };

	it("should call `entityCreated` event", () => {
		return service.entityChanged("created", doc, ctx).catch(protectReject).then(() => {
			expect(service.clearCache).toHaveBeenCalledTimes(1);

			expect(service.schema.entityCreated).toHaveBeenCalledTimes(1);
			expect(service.schema.entityCreated).toHaveBeenCalledWith(doc, ctx);
		});
	});

	it("should call `entityUpdated` event", () => {
		service.clearCache.mockClear();
		return service.entityChanged("updated", doc, ctx).catch(protectReject).then(() => {
			expect(service.clearCache).toHaveBeenCalledTimes(1);

			expect(service.schema.entityUpdated).toHaveBeenCalledTimes(1);
			expect(service.schema.entityUpdated).toHaveBeenCalledWith(doc, ctx);
		});
	});

	it("should call `entityRemoved` event", () => {
		service.clearCache.mockClear();
		return service.entityChanged("removed", doc, ctx).catch(protectReject).then(() => {
			expect(service.clearCache).toHaveBeenCalledTimes(1);

			expect(service.schema.entityRemoved).toHaveBeenCalledTimes(1);
			expect(service.schema.entityRemoved).toHaveBeenCalledWith(doc, ctx);
		});
	});

});

describe("Test sanitizeParams method", () => {
	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		settings: {
			maxPageSize: 50,
			maxLimit: 200,
			pageSize: 25
		}
	});

	let ctx = {
		action: {
			name: "greeter.hello"
		}
	};

	let ctxList = {
		action: {
			name: "greeter.list"
		}
	};

	it("should not touch the params", () => {
		const res = service.sanitizeParams(ctx, {});
		expect(res).toEqual({});
	});

	it("should convert limit & offset to number", () => {
		const res = service.sanitizeParams(ctx, { limit: "5", offset: "10" });
		expect(res).toEqual({ limit: 5, offset: 10 });
	});

	it("should convert page & pageSize to number", () => {
		const res = service.sanitizeParams(ctx, { page: "5", pageSize: "10" });
		expect(res).toEqual({ page: 5, pageSize: 10 });
	});

	it("should convert sort to array", () => {
		const res = service.sanitizeParams(ctx, { sort: "name,createdAt votes" });
		expect(res).toEqual({ sort: ["name", "createdAt", "votes"] });
	});

	it("should convert fields to array", () => {
		const res = service.sanitizeParams(ctx, { fields: "name votes author" });
		expect(res).toEqual({ fields: ["name", "votes", "author"] });
	});

	it("should convert populate to array", () => {
		const res = service.sanitizeParams(ctx, { populate: "author voters" });
		expect(res).toEqual({ populate: ["author", "voters"] });
	});

	it("should fill pagination fields", () => {
		const res = service.sanitizeParams(ctxList, {});
		expect(res).toEqual({ limit: 25, offset: 0, page: 1, pageSize: 25});
	});

	it("should calc limit & offset from pagination fields", () => {
		const res = service.sanitizeParams(ctxList, { page: 3, pageSize: 20 });
		expect(res).toEqual({ limit: 20, offset: 40, page: 3, pageSize: 20});
	});

	it("should limit the pageSize", () => {
		const res = service.sanitizeParams(ctxList, { page: 1, pageSize: 100 });
		expect(res).toEqual({ limit: 50, offset: 0, page: 1, pageSize: 50});
	});

	it("should limit the limit", () => {
		const res = service.sanitizeParams({ action: {	name: "greeter.find" } }, { limit: 400 });
		expect(res).toEqual({ limit: 200 });
	});


});

const mockAdapter = {
	init: jest.fn(() => Promise.resolve()),
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(() => Promise.resolve()),
	entityToObject: jest.fn(obj => obj)
};

describe("Test transformDocuments method", () => {

	describe("Test with object", () => {
		const doc = { _id : 1 };

		const broker = new ServiceBroker({ validation: false });
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter
		});

		service.encodeID = jest.fn(id => id);
		service.decodeID = jest.fn(id => id);
		service.populateDocs = jest.fn((ctx, docs) => Promise.resolve(docs));
		service.filterFields = jest.fn(docs => Promise.resolve(docs));

		it("should not call anything if the docs is null", () => {
			const ctx = { params: {} };
			return service.transformDocuments(ctx, ctx.params, null).then(res => {
				expect(res).toBe(null);
				expect(mockAdapter.entityToObject).toHaveBeenCalledTimes(0);
				expect(service.populateDocs).toHaveBeenCalledTimes(0);
				expect(service.filterFields).toHaveBeenCalledTimes(0);
			}).catch(protectReject);
		});

		it("should not call anything if the docs is a Number", () => {
			const ctx = { params: {} };
			return service.transformDocuments(ctx, ctx.params, 100).then(res => {
				expect(res).toBe(100);
				expect(mockAdapter.entityToObject).toHaveBeenCalledTimes(0);
				expect(service.populateDocs).toHaveBeenCalledTimes(0);
				expect(service.filterFields).toHaveBeenCalledTimes(0);
			}).catch(protectReject);
		});

		it("should call 'populateDocs' & filterFields methods", () => {
			service.populateDocs.mockClear();
			mockAdapter.entityToObject.mockClear();
			const ctx = { params: { populate: ["author"] } };
			return service.transformDocuments(ctx, ctx.params, doc).then(res => {
				expect(res).toBe(doc);

				expect(mockAdapter.entityToObject).toHaveBeenCalledTimes(1);
				expect(mockAdapter.entityToObject).toHaveBeenCalledWith(doc);

				expect(service.encodeID).toHaveBeenCalledTimes(1);
				expect(service.encodeID).toHaveBeenCalledWith(doc._id);

				expect(service.populateDocs).toHaveBeenCalledTimes(1);
				expect(service.populateDocs).toHaveBeenCalledWith(ctx, [doc], ["author"]);

				expect(service.filterFields).toHaveBeenCalledTimes(1);
				expect(service.filterFields).toHaveBeenCalledWith(doc, service.settings.fields);
			}).catch(protectReject);
		});

		it("should not call 'populateDocs' but filterFields methods", () => {
			service.filterFields.mockClear();
			service.populateDocs.mockClear();
			service.encodeID.mockClear();
			mockAdapter.entityToObject.mockClear();

			const ctx = { params: { fields: ["name"] } };
			return service.transformDocuments(ctx, ctx.params, doc).then(res => {
				expect(res).toBe(doc);

				expect(mockAdapter.entityToObject).toHaveBeenCalledTimes(1);
				expect(mockAdapter.entityToObject).toHaveBeenCalledWith(doc);

				expect(service.encodeID).toHaveBeenCalledTimes(1);
				expect(service.encodeID).toHaveBeenCalledWith(doc._id);

				expect(service.populateDocs).toHaveBeenCalledTimes(0);

				expect(service.filterFields).toHaveBeenCalledTimes(1);
				expect(service.filterFields).toHaveBeenCalledWith(doc, ["name"]);
			}).catch(protectReject);
		});
	});

	describe("Test with array of object", () => {
		const docs = [
			{ _id : 2 },
			{ _id : 5 }
		];

		const broker = new ServiceBroker({ validation: false });
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter
		});

		service.encodeID = jest.fn(id => id);
		service.decodeID = jest.fn(id => id);
		service.populateDocs = jest.fn((ctx, docs) => Promise.resolve(docs));
		service.filterFields = jest.fn(docs => docs);

		it("should call 'populateDocs' & filterFields methods", () => {
			mockAdapter.entityToObject.mockClear();
			const ctx = { params: { populate: ["author"] } };
			return service.transformDocuments(ctx, ctx.params, docs).then(res => {
				expect(res).toEqual(docs);

				expect(mockAdapter.entityToObject).toHaveBeenCalledTimes(2);
				expect(mockAdapter.entityToObject).toHaveBeenCalledWith(docs[0]);
				expect(mockAdapter.entityToObject).toHaveBeenCalledWith(docs[1]);

				expect(service.encodeID).toHaveBeenCalledTimes(2);
				expect(service.encodeID).toHaveBeenCalledWith(docs[0]._id);
				expect(service.encodeID).toHaveBeenCalledWith(docs[1]._id);

				expect(service.populateDocs).toHaveBeenCalledTimes(1);
				expect(service.populateDocs).toHaveBeenCalledWith(ctx, docs, ["author"]);

				expect(service.filterFields).toHaveBeenCalledTimes(2);
				expect(service.filterFields).toHaveBeenCalledWith(docs[0], service.settings.fields);
				expect(service.filterFields).toHaveBeenCalledWith(docs[1], service.settings.fields);
			}).catch(protectReject);
		});
	});

});

describe("Test authorizeFields method", () => {
	/*const doc = {
		id : 1,
		name: "Walter",
		address: {
			street: "3828 Piermont Dr",
			city: "Albuquerque",
			state: "NM",
			zip: "87112",
			country: "USA"
		},
		email: "walter.white@heisenberg.com",
		password: "H3153n83rg"
	};*/

	describe("Test with nested fields", () => {
		const broker = new ServiceBroker();
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter,
			settings: {
				fields: ["id", "name", "address", "bio.body"]
			}
		});

		it("should remove the email & password", () => {
			const res = service.authorizeFields(["id", "name", "address", "email", "password", "otherProp"]);
			expect(res).toEqual(["id", "name", "address"]);
		});

		it("should remove the email", () => {
			const res = service.authorizeFields(["id", "name", "address.city", "address.state", "email"]);
			expect(res).toEqual(["id", "name", "address.city", "address.state"]);
		});

		it("should remove the disabled bio fields", () => {
			const res = service.authorizeFields(["id", "name", "bio.body.height", "bio.male", "bio.dob.year", "bio.body.hair.color"]);
			expect(res).toEqual(["id", "name", "bio.body.height", "bio.body.hair.color"]);
		});
	});

	describe("Test with enabled nested fields", () => {
		const broker = new ServiceBroker();
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter,
			settings: {
				fields: ["id", "name", "address.city", "address.state", "address.country", "bio.body.height", "bio.male", "bio.body.hair.color"]
			}
		});

		it("should fill the nested enabled fields", () => {
			let res = service.authorizeFields(["id", "name", "address"]);
			expect(res).toEqual(["id", "name", "address.city", "address.state", "address.country"]);

			res = service.authorizeFields(["id", "name", "bio.male", "bio.body"]);
			expect(res).toEqual(["id", "name", "bio.male", "bio.body.height", "bio.body.hair.color"]);
		});

	});

});

describe("Test filterFields method", () => {
	const doc = {
		id : 1,
		name: "Walter",
		address: {
			city: "Albuquerque",
			state: "NM",
			zip: 87111
		}
	};

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		adapter: mockAdapter,
		settings: {
			fields: "id name address"
		}
	});

	it("should not touch the doc", () => {
		const res = service.filterFields(doc);
		expect(res).toBe(doc);
	});

	it("should filter the fields", () => {
		const res = service.filterFields(doc, ["name", "address"]);
		expect(res).toEqual({
			name: "Walter",
			address: doc.address
		});
	});

	it("should filter with nested fields", () => {
		const res = service.filterFields(doc, ["name", "address.city", "address.zip"]);
		expect(res).toEqual({
			name: "Walter",
			address: {
				city: "Albuquerque",
				zip: 87111
			}
		});
	});

});

describe("Test populateDocs method", () => {
	const RATES = ["No rate", "Poor", "Acceptable", "Average", "Good", "Excellent"];
	const docs = [{ id: 1, author: 3, rate: 4 }, { id: 2, author: 5, comments: [8, 3, 8], rate: 0 }, { id: 3, author: 8, rate: 5 }];

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		adapter: mockAdapter,
		settings: {
			populates: {
				"comments": "comments.get",
				"author": {
					action: "users.get",
					params: {
						fields: "username fullName"
					}
				},
				"rate": jest.fn(function(ids, docs) {
					docs.forEach(doc => doc.rate = RATES[doc.rate]);
					return this.Promise.resolve();
				})
			}
		}
	});

	it("should call 'populateDocs' with rules from settings", () => {
		const ctx = { params: {} };
		ctx.call = jest.fn(() => Promise.resolve({
			"3": {
				"fullName": "Walter"
			},
			"5": {
				"fullName": "John"
			},
			"8": {
				"fullName": "Jane"
			}
		})).mockImplementationOnce(() => Promise.resolve({
			"8": { id: 8, title: "Lorem" },
			"3": { id: 3, title: "ipsum" }
		}));

		return service.populateDocs(ctx, docs, ["author", "comments", "rate"]).then(res => {
			expect(ctx.call).toHaveBeenCalledTimes(2);
			expect(ctx.call).toHaveBeenCalledWith("users.get", {
				fields: "username fullName",
				id: [3, 5, 8],
				mapping: true
			});
			expect(ctx.call).toHaveBeenCalledWith("comments.get", {
				id: [8, 3],
				mapping: true
			});

			expect(service.settings.populates.rate).toHaveBeenCalledTimes(1);
			expect(service.settings.populates.rate).toHaveBeenCalledWith([4, 5], docs, {
				field: "rate",
				handler: jasmine.any(Function)
			}, ctx);

			expect(res).toEqual([
				{
					"author": {
						"fullName": "Walter"
					},
					"comments": undefined,
					"id": 1,
					"rate": "Good"
				},
				{
					"author": {
						"fullName": "John"
					},
					"comments": [
						{
							"id": 8,
							"title": "Lorem"
						},
						{
							"id": 3,
							"title": "ipsum"
						},
						{
							"id": 8,
							"title": "Lorem"
						}
					],
					"id": 2,
					"rate": "No rate"
				},
				{
					"author": {
						"fullName": "Jane"
					},
					"comments": undefined,
					"id": 3,
					"rate": "Excellent"
				}
			]);

		}).catch(protectReject);
	});

	it("should call 'populateDocs' with multiple doc & only author population", () => {
		const ctx = { params: {} };
		ctx.call = jest.fn(() => Promise.resolve({
			"3": {
				"name": "Walter"
			},
			"5": {
				"name": "John"
			},
			"8": {
				"name": "Jane"
			}
		}));
		const docs = [
			{ author: 8 },
			{ author: 5 },
			{ author: 8 },
			{ author: 13 }
		];

		return service.populateDocs(ctx, docs, ["author", "voters"]).then(res => {

			expect(res).toEqual([
				{ author: { name: "Jane" } },
				{ author: { name: "John" } },
				{ author: { name: "Jane" } },
				{ author: undefined },
			]);

		}).catch(protectReject);
	});

	it("should return docs if no populate list", () => {
		const docs = [];
		const ctx = { params: {} };

		return service.populateDocs(ctx, docs).then(res => {
			expect(res).toBe(docs);

		}).catch(protectReject);
	});

	it("should return docs if docs is not array or object", () => {
		const docs = 5;
		const ctx = { params: {} };

		return service.populateDocs(ctx, docs, ["author"]).then(res => {
			expect(res).toBe(docs);

		}).catch(protectReject);
	});

});

describe("Test validateEntity method", () => {

	describe("Test with custom validator function", () => {

		const validator = jest.fn();

		const broker = new ServiceBroker({ validation: false });
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter,
			settings: {
				entityValidator: validator
			}
		});

		it("should call 'entityValidator'", () => {
			let entity = {};
			return service.validateEntity(entity).catch(protectReject).then(() => {
				expect(validator).toHaveBeenCalledTimes(1);
				expect(validator).toHaveBeenCalledWith(entity);
			});
		});

		it("should call 'entityValidator' multiple times", () => {
			validator.mockClear();
			let entities = [{}, {}];
			return service.validateEntity(entities).catch(protectReject).then(() => {
				expect(validator).toHaveBeenCalledTimes(2);
				expect(validator).toHaveBeenCalledWith(entities[0]);
				expect(validator).toHaveBeenCalledWith(entities[1]);
			});
		});

	});

	describe("Test with built-in validator function", () => {

		const broker = new ServiceBroker({ validation: true });
		const service = broker.createService(DbService, {
			name: "store",
			adapter: mockAdapter,
			settings: {
				entityValidator: {
					id: "number",
					name: "string"
				}
			}
		});

		it("should call validator with correct entity", () => {
			let entity = { id: 5, name: "John" };
			return service.validateEntity(entity).catch(protectReject).then(res => {
				expect(res).toBe(entity);
			});
		});

		it("should call validator with incorrect entity", () => {
			let entities = [{ id: 5, name: "John" }, { name: "Jane" }];
			return service.validateEntity(entities).then(protectReject).catch(err => {
				expect(err).toBeDefined();
				expect(err).toBeInstanceOf(ValidationError);
				expect(err.code).toBe(422);
				expect(err.message).toBe("Entity validation error!");

				expect(err.data[0].type).toBe("required");
				expect(err.data[0].field).toBe("id");
			});
		});

	});

});


describe("Test encodeID/decodeID method", () => {

	const broker = new ServiceBroker({ validation: false });
	const service = broker.createService(DbService, {
		name: "store",
		adapter: mockAdapter,
		settings: {}
	});

	it("should return with the same ID", () => {
		expect(service.encodeID(5)).toBe(5);
	});

	it("should return with the same ID", () => {
		expect(service.decodeID(5)).toBe(5);
	});

});

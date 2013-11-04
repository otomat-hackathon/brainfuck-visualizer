Backbone.Model.prototype.increase = function (key, addition) {
    this.set(key, this.get(key) + addition)
};

var Cell = Backbone.Model.extend({
    defaults: {
        value: 0
    },
    inc: function () {
        if (this.get("value") == 255)
            this.set("value", 0);
        else
            this.increase("value", 1);
    },
    dec: function () {
        if (this.get("value") == 0)
            this.set("value", 255)
        else
            this.increase("value", -1);
    },
    put: function (c) {
        this.set("value", c.charCodeAt(0));
    },
    char: function () {
        return String.fromCharCode(this.get("value"))
    }
});

var Tape = Backbone.Collection.extend({
    model: Cell
});

var Pointer = Backbone.Model.extend({
    defaults: {
        index: 0
    },
    left: function () {
        this.increase("index", -1);
    },
    right: function () {
        this.increase("index", +1);
    }
});

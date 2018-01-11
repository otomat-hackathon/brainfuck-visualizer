Backbone.Model.prototype.increase = function (key, addition) {
    this.set(key, this.get(key) + addition)
};

var Cell = Backbone.Model.extend({
    defaults: {
        value: 0
    },
    inc: function (c) {
        this.set("value", (this.get("value") + c)%256);
    },
    dec: function (c) {
        var val = this.get("value") - c;
        if (val < 0) {
          val += 256*(Math.ceil(-val/256));
        }
        this.set("value", val);
    },
    put: function (c) {
        var isHex = $('#hex-io').is(':checked');

        var value = isHex ? parseInt(c, 16) : c.charCodeAt(0);
        this.set("value", value);
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
    left: function (c) {
        this.increase("index", -c);
    },
    right: function (c) {
        this.increase("index",  c);
    }
});

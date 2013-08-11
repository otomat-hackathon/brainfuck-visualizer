var CellView = Backbone.View.extend({
    tagName: "li",
    initialize: function () {
        this.model.on('change', this.render, this);
    },
    render: function () {
        this.$el.html(this.model.get("value"));
        return this;
    }
});

var PointerView = Backbone.View.extend({
    el: "div.pointer",
    initialize: function () {
        this.model.on("change", this.render, this);
    },
    render: function () {
        this.$el.animate({
            "margin-left": this.model.get("index") * this.$el.width()
        }, 30);
        return this;
    }
});

var TapeView = Backbone.View.extend({
    el: ".tape",
    initialize: function (options) {
        this.pointer = options.pointer;
    },
    render: function () {
        _.forEach(this.model.models, function (model) {
            this.$el.append((new CellView({
                model: model
            })).render().el);
        }, this);


        new PointerView({
            model: this.pointer
        }).render();

        return this;
    }
});


var InterpreterView = Backbone.View.extend({
    delay: 100,
    el: "#interpreter",
    initialize: function (options) {
        this.pointer = options.pointer;
        this.tape = options.tape;
        this.editor = options.editor;
    },
    events: {
        "click #run": "run",
        "click #pause": "pause",
        "click #continue": "continue",
        "click #stop": "stop",
        "keyup #source": "sourceChange",
        "change #input": "recieveInput"
    },
    render: function () {
	this.input  = this.$el.find("#input");
        this.output = this.$el.find("#output");
        this.buttons = new ButtonSwitchView({
            el: this.el
        }).render();
        new TapeView({
            model: this.tape,
            pointer: this.pointer
        }).render();
    },
    run: function () {
        this.reset();
        this.output.empty();
        this.input.val("");
        this.interpreter = new Interpreter(
            this.editor.text(),
            this.tape,
            this.pointer,
            this.out.bind(this),
            this.awaitInput.bind(this),
            this.instruction.bind(this));
        this.continue();
    },
    out: function (cell) {
        this.output.append(cell.char());
    },
    awaitInput: function (cell) {
        this.input.parent().show();
        this.pause();
        this.inputTarget = cell;
    },
    recieveInput: function () {
        this.inputTarget.put(this.input.val());
        this.input.parent().hide();
        this.input.val("");
        this.continue();
    },
    instruction: function(index) {
        this.editor.find("span.caret").contents().unwrap();
        var src = this.editor.text();
        // XXX: There probably is a more elegant way to preserve the
        //      encoded characters. (< as &lt; and so on)
        var e = $('<div/>');
        src = e.text(src.substr(0, index)).html()
            + "<span class=\"caret\">"
            + e.text(src.charAt(index)).html()
            + "</span>"
            + e.text(src.substr(index + 1)).html();
        this.editor.html(src);
    },
    continue: function () {
        this.interval = setInterval(function () {
            try {
                this.interpreter.next();
            } catch (e) {
                clearInterval(this.interval);
                this.buttons.stop();
            }
        }.bind(this), this.delay);
    },
    pause: function () {
        clearInterval(this.interval);
    },
    reset: function () {
        this.pointer.set("index", 0);
        _(this.tape.models).forEach(function (model) {
            model.set("value", 0);
        }, this);
    },
    stop: function () {
        this.pause();
        this.reset();
    },
    sourceChange: function() {
        this.stop();
        this.editor.html(this.editor.text());
    }
});


var ButtonSwitchView = Backbone.View.extend({
    events: {
        "click #run": "run",
        "click #stop": "stop",
        "click #pause": "pause",
        "click #continue": "continue",
        "keyup #source": "stop"
    },
    run: function () {
        this.$el.find("#run").hide();
        this.$el.find("#stop, #pause").show();
        return false;
    },
    stop: function () {
        this.$el.find("#stop, #pause, #continue").hide();
        this.$el.find("#run").show();
        return false;
    },
    pause: function () {
        this.$el.find("#pause").hide();
        this.$el.find("#continue").show();
        return false;
    },
    continue: function () {
        this.$el.find("#continue").hide();
        this.$el.find("#pause").show();
        return false;
    }
});

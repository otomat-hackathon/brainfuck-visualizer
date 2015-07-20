var CellView = Backbone.View.extend({
    tagName: "li",
    initialize: function () {
        this.model.on('change', this.render, this);
    },
    render: function () {
        this.$el.html(CellView.template({
            index: this.model.get("index"),
            value: this.model.get("value")
        }));
        return this;
    }
}, {
    template: _.template("<div class=cell-index><%= index %></div>" +
                         "<div class=cell-value><%= value %></div>"),
});

var PointerView = Backbone.View.extend({
    el: "div.pointer",
    initialize: function (options) {
        this.model.on("move", this.render, this);
        this.interpreter = options.interpreter;
        this.tape = options.tape;
    },
    render: function () {
        var offset = this.model.get("index") - this.tape.get("windowStart");
        this.$el.animate({
            "margin-left": offset * this.$el.width()
        }, 30);
        return this;
    }
});

var TapeView = Backbone.View.extend({
    el: ".tape",
    initialize: function (options) {
        this.pointer = options.pointer;
        this.interpreter = options.interpreter;
        this.pointer.on("change", this.handlePointerMove, this);
    },
    handlePointerMove: function () {
        var index = this.pointer.get("index");

        if (index < this.model.get("cells").first().get("index")) {
            this.model.get("cells").unshift({ index: index });
        } else if (this.model.get("cells").last().get("index") < index) {
            this.model.get("cells").push({ index: index });
        }

        var windowStart = this.model.get("windowStart");
        var windowEnd = windowStart + this.model.get("windowSize") - 1;

        if (index < windowStart) {
            while (index != windowStart--) {
                this.moveWindowLeft();
            }
        } else if (windowEnd < index) {
            while (index != windowEnd++) {
                this.moveWindowRight();
            }
        }

        this.pointer.trigger("move");
    },
    moveWindowLeft: function () {
        var windowStart = this.model.get("windowStart") - 1;
        this.model.set("windowStart", windowStart);

        _(this.cellViews).last().remove();
        this.cellViews.pop();
        var cell = this.model.get("cells").at(this.model.tapeIndex(windowStart));
        var cellView = new CellView({
            model: cell
        }, this);
        this.cellViews.unshift(cellView);
        this.$el.prepend(cellView.render().el);
    },
    moveWindowRight: function () {
        var windowStart = this.model.get("windowStart");
        var windowEnd = windowStart + this.model.get("windowSize");
        this.model.set("windowStart", ++windowStart);

        _(this.cellViews).first().remove();
        this.cellViews.shift();
        var cell = this.model.get("cells").at(this.model.tapeIndex(windowEnd));
        var cellView = new CellView({
            model: cell
        }, this);
        this.cellViews.push(cellView);
        this.$el.append(cellView.render().el);
    },
    render: function () {
        var windowStart = this.model.get("windowStart");
        var windowEnd = windowStart + this.model.get("windowSize") - 1;
        var cells = this.model.get("cells");
        cells = cells.slice(this.model.tapeIndex(windowStart),
                            this.model.tapeIndex(windowEnd) + 1);

        this.cellViews = _.map(cells, function (cell) {
            var cellView = new CellView({
                model: cell
            });
            this.$el.append(cellView.render().el);
            return cellView;
        }, this);

        new PointerView({
            model: this.pointer,
            interpreter: this.interpreter,
            tape: this.model
        }).render();

        return this;
    }
});


var InterpreterView = Backbone.View.extend({
    delay: 30,
    el: "#interpreter",
    initialize: function (options) {
        this.pointer = options.pointer;
        this.tape = options.tape;
        this.editor = options.editor;
    },
    events: {
        "click #run": "run",
        "click #first-step": "firstStep",
        "click #step": "step",
        "click #pause": "pause",
        "click #continue": "loop",
        "click #stop": "stop",
        "change #input": "receiveInput",
        "change #delay": "changeDelay"
    },
    render: function () {
	    this.input  = this.$el.find("#input");
        this.output = this.$el.find("#output");
        this.preview = this.$el.find("#preview");
        this.buttons = new ButtonSwitchView({
            el: this.el
        }).render();
        new TapeView({
            model: this.tape,
            pointer: this.pointer,
            interpreter: this
        }).render();
        this.preview.hide();
    },
    showPreview: function () {
        this.preview.show();
        this.editor.hide();
    },
    showEditor: function () {
        this.preview.hide();
        this.editor.show();
    },
    begin: function () {
        this.reset();
        this.preview.empty();
        this.output.empty();
        this.output.removeClass("error");
        this.input.val("");
        this.interpreter = new Interpreter(
            this.editor.val(),
            this.tape,
            this.pointer,
            this.out.bind(this),
            this.awaitInput.bind(this),
            this.instruction.bind(this));
        this.showPreview();
    },
    run: function () {
        this.begin();
        this.loop();
    },
    firstStep: function () {
        this.begin();
        this.step();
    },
    out: function (cell) {
        this.output.append(cell.char());
    },
    awaitInput: function (cell) {
        this.input.parent().show();
        this.pause();
        this.inputTarget = cell;
    },
    receiveInput: function () {
        this.inputTarget.put(this.input.val());
        this.input.parent().hide();
        this.input.val("");
        this.loop();
    },
    removeCaret: function () {
        this.editor
            .find("span.caret")
            .contents()
            .unwrap();
    },
    instruction: function(index) {
        this.removeCaret();

        var source = this.editor.val(),
            caret = $("<span>")
            .addClass("caret")
            .html(source.charAt(index));

        this.preview
            .empty()
            .append(source.substr(0, index))
            .append(caret)
            .append(source.substr(index + 1));
    },
    loop: function () {
        this.interval = setInterval(function () {
            this.step();
        }.bind(this), this.delay);
    },
    step: function () {
        try {
            this.interpreter.next();
        } catch (e) {
            this.pause();
            this.buttons.stop();
            this.showEditor();
            if (e.name == "Error") {
                this.output.text(e.message);
                this.output.addClass("error");
            }
        }
    },
    pause: function () {
        clearInterval(this.interval);
        this.interval = null;
    },
    reset: function () {
        this.pointer.set("index", 0);
        this.tape.get("cells").forEach(function (cell) {
            cell.set("value", 0);
        }, this);
    },
    stop: function () {
        this.pause();
        this.reset();
        this.buttons.stop();
        this.showEditor();
    },
    changeDelay: function () {
        if (this.interval) {
            this.pause();
            this.delay = $("#delay").val();
            this.loop();
        } else {
            this.delay = $("#delay").val();
        }
    }
});


var ButtonSwitchView = Backbone.View.extend({
    events: {
        "click #run": "run",
        "click #first-step": "firstStep",
        "click #stop": "stop",
        "click #pause": "pause",
        "click #continue": "loop",
        "keyup #source": "stop"
    },
    run: function () {
        this.$el.find("#run, #first-step").hide();
        this.$el.find("#stop, #pause").show();
        return false;
    },
    firstStep: function () {
        this.$el.find("#run, #first-step").hide();
        this.$el.find("#stop, #step, #continue").show();
        return false;
    },
    stop: function () {
        this.$el.find("#stop, #step, #pause, #continue").hide();
        this.$el.find("#run, #first-step").show();
        return false;
    },
    pause: function () {
        this.$el.find("#pause").hide();
        this.$el.find("#step, #continue").show();
        return false;
    },
    loop: function () {
        this.$el.find("#step, #continue").hide();
        this.$el.find("#pause").show();
        return false;
    }
});

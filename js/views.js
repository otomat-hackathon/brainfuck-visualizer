function stringOfLength(string,command) {
  var substr = "";
  for(var i = 0; i < string.length-1; i++) {
    substr+="_";
  }
  return command + substr;
}
function replace(string) {
  string = string.replace(new RegExp(document.getElementById("HERP").value, "g"),stringOfLength(document.getElementById("HERP").value, ">"));
  string = string.replace(new RegExp(document.getElementById("DERP").value, "g"),stringOfLength(document.getElementById("DERP").value, "<"));
  string = string.replace(new RegExp(document.getElementById("HURR").value, "g"),stringOfLength(document.getElementById("HURR").value, "+"));
  string = string.replace(new RegExp(document.getElementById("DURR").value, "g"),stringOfLength(document.getElementById("DURR").value, "-"));
  string = string.replace(new RegExp(document.getElementById("GIGGITY").value, "g"),stringOfLength(document.getElementById("GIGGITY").value, "."));
  string = string.replace(new RegExp(document.getElementById("GOO").value, "g"),stringOfLength(document.getElementById("GOO").value, ","));
  string = string.replace(new RegExp(document.getElementById("WOOPY").value, "g"),stringOfLength(document.getElementById("WOOPY").value, "["));
  string = string.replace(new RegExp(document.getElementById("DOO").value, "g"),stringOfLength(document.getElementById("DOO").value, "]"));
  return string;
}

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
    initialize: function (options) {
        this.model.on("change", this.render, this);
        this.interpreter = options.interpreter;
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
        this.interpreter = options.interpreter;
    },
    render: function () {
        _.forEach(this.model.models, function (model) {
            this.$el.append((new CellView({
                model: model
            })).render().el);
        }, this);

        new PointerView({
            model: this.pointer,
            interpreter: this.interpreter
        }).render();

        return this;
    }
});


var InterpreterView = Backbone.View.extend({
    delay: "90",
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
        "change #delay": "changeDelay",
        "input #source": "setShareURL",
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
      this.setSourceFromURL();
    },
    setShareURL: function () {
      location.hash = "#" + btoa(this.editor.val())
    },
    setSourceFromURL: function () {
      if (location.hash) {
        var bfCode = atob(location.hash.replace(/^#/, ""))
        this.editor.val(decodeURIComponent(bfCode));
        _.defer(this.run.bind(this));
      }
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
            replace(this.editor.val()),
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
        this.input.focus();
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
            this.interpreter.next($("#optimize").is(':checked'));
        } catch (e) {
            this.pause();
            this.buttons.stop();
            this.showEditor();
            if (e.name == "Error") {
                this.output.text(e.message);
                this.output.addClass("error");
            } else if (e.name != "End") {
                console.error(e);
            }
        }
    },
    pause: function () {
        clearInterval(this.interval);
        this.interval = null;
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

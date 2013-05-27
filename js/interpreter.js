var Interpreter = function (source, tape, pointer, out, instruction) {
    /*
    * Brainfuck Interpreter Class
    * @source: Brainfuck script
    * @tape: Tape model
    * @pointer: Pointer model
    * @out: Output callback
    *
    * Usage:
    *
    *    var interpreter = new Interpreter(">", tape, pointer);
    *    interpreter.next()
    *    pointer.get("index") // 1
    *
    * */
    var tokens = "<>+-.,[]";
    var jumps = [], action = 0;

    this.next = function () {
        if (action > source.length) throw {
            "name": "End",
            "message": "End of brainfuck script."
        };
        // Skip non-code characters
        if (tokens.indexOf(source[action]) === -1) {
            action++;
            return this.next();
        }
        instruction(action);
        var token = source[action];
        var cell = tape.models[pointer.get("index")];
        switch (token) {
            case "<":
                pointer.left();
                break;

            case ">":
                pointer.right();
                break;

            case "-":
                cell.dec();
                break;

            case "+":
                cell.inc();
                break;

            case ",":
                // not implemented
                break;

            case ".":
                out(cell);
                break;

            case "[":
                if (cell.get("value") != 0) {
                    jumps.push(action);
                } else {
                    while(source[action] !== ']') {
                        action++;
                    }
                }
                break;

            case "]":
                if (cell.get("value") != 0) {
                    action = jumps[jumps.length - 1];
                } else {
                    jumps.pop();
                }
        }
        return action++;
    }
};

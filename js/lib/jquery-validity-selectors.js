// See https://stackoverflow.com/questions/15820780/jquery-support-invalid-selector/48211642

jQuery.extend(jQuery.expr[':'], {
    invalid : function(elem, index, match){
        return elem.validity !== undefined && elem.validity.valid === false;
    },

    valid : function(elem, index, match){
        return elem.validity !== undefined && elem.validity.valid === true;
    }


});
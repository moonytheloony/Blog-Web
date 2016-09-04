$(function(){
    $('#gname').on('keyup', function() {
        if ($(this).val().toLowerCase == "guest") 
            $('#number').slideDown('fast')
        else 
            $('#number').hide();
    });
});
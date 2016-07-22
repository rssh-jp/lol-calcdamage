(function(){
    $('#btn_secret').on('click', function(){
        console.log('this : ', this);
        console.log('txt_secret : ', $('#txt_secret'));
        $('.form-group').txt_secret.value = 'aaa';
    });
}).call(this);

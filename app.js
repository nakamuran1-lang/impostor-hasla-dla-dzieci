
document.getElementById('revealSlider').addEventListener('input', function(){
  if(parseInt(this.value) > 90){
    document.getElementById('role').style.display='block';
    this.value=0;
  }
});

/**
 * Entfernung mit dem HC-SR04 Ultraschall-Sensor messen
 * @param  pfio 
 * @param {*} trigger 
 * @param {*} echo 
 * @param {*} callback 
 */
module.exports=function(pfio,trigger,echo,callback){
    pfio.digital_write(trigger,1);
    setTimeout(function(){
        pfio.digital_write(trigger,0);
        let start=new Date().getTime();
        while(pfio.digital_read(echo)!=1){
            start=new Date().getTime();
        }
        let end=start;
        while(pfio.digital_read(echo)!=0){
            end=new Date().getTime();
        }
        let time=end-start;
        let distance=time/2*0.034;
        callback(distance);
    },15)
}
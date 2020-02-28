const validator2 = require('./IpValidation2')
var config = process.env.CUSTOMCONNSTR_FirewallValidator;


const sql = require("mssql");


var src_ip;
var dst_ip;
var port;
var port_num;


async function main(){
 src_ip = String(src_ip)
 dst_ip = String(dst_ip)
 port = String(port)
 port_num = String(port_num)
   var src_id;
   var dst_id;
   var firewall;
   var subnets;
   var src_subnet;
   var dst_subnet;
   var port_number;
   var obj=new sql.ConnectionPool(config).connect().then(async (pool) => {
       subnets = await (pool.request().query("select subnet from telecom.dcmatrix_zone_subnet;"));
       let var_subnets = subnets.recordset.map(o => o['subnet']);


       // Stores all the subnets in a variable (String type)
       for (i = 0; i < var_subnets.length; i++){
         var_subnets[i] = String(var_subnets[i]).trim();  
       }
      
       // Stores the source subnet if the source IP is found within any subnet
       for (i = 0; i < var_subnets.length; i++){
         if (validator2.inSubNet(src_ip, var_subnets[i]) == true){
           src_subnet = var_subnets[i];
           break;
         }
         else if (i == var_subnets.length - 1 && validator2.inSubNet(src_ip, var_subnets[i]) == false){
           return 1
         }
       }
       // Stores the destination subnet if the destination IP is found within any subnet
       for (i = 0; i < var_subnets.length; i++){
         if (validator2.inSubNet(dst_ip, var_subnets[i])){
           dst_subnet = var_subnets[i];
           break;
         }
         else if (i == var_subnets.length - 1 && validator2.inSubNet(dst_ip, var_subnets[i]) == false){
           return 1
         }
       }


       src_id = await (pool.request().query("select id from telecom.dcmatrix_zone_subnet where subnet = '"+src_subnet+"';"));
       dst_id = await (pool.request().query("select id from telecom.dcmatrix_zone_subnet where subnet = '"+dst_subnet+"';"));
      


       let var_src_id = src_id.recordset.map(o => o['id'])
       let var_dst_id = dst_id.recordset.map(o => o['id'])
       src_id_final = String(var_src_id[0])
       dst_id_final = String(var_dst_id[0])
      
      
       firewall = await (pool.request().query("select firewall from telecom.dcmatrix_zone_port_firewall where src_id = '"+src_id_final+ "' and dst_id = '"+dst_id_final+"';"));
      
      
       let var_firewall = firewall.recordset.map(o => o['firewall'])
       firewall_final = String(var_firewall)
      
       port_number = await (pool.request().query("select prt_number from telecom.dcmatrix_zone_port_firewall where src_id = '"+src_id_final+ "' and dst_id = '"+dst_id_final+"';"))
      
       let var_port_number = port_number.recordset.map(o => o['prt_number'])
       prt_number_final = String(var_port_number)
      
      
       user_port_name = port
       user_port_number = port_num
      
       if (firewall_final.includes('Not Allowed') || firewall_final.includes('Not allowed') || firewall_final.includes('not allowed') || firewall_final.includes('not Allowed') || firewall_final.includes('n/a')){
         return 1;
       }
       else{
         prt_number_final = prt_number_final.split(",")
        


         for (i = 0; i < prt_number_final.length; i++){
           if (prt_number_final[i].includes(user_port_name) && prt_number_final[i].includes(user_port_number)){
             return 0
           }
           else if (prt_number_final[i].includes("-")){
            
             if (prt_number_final[i].includes(user_port_name)){
              
               temp = prt_number_final[i].split(" ")
              
               temp_num = temp[1]
               temp_num = temp_num.split("-")
               temp_num1 = temp_num[0]
               temp_num2 = temp_num[1]
              
               if (parseInt(user_port_number) >= parseInt(temp_num1) && parseInt(user_port_number) <= parseInt(temp_num2)){
                 return 0
               }
             }
           }
         }
         return 1
       }
     })
       return obj;
}


function varExists(el) {
 if ( typeof el !== "undefined" && !(el === null)) {
   return true;
 } else {
   return false;
 }
}


module.exports.index = async function (context, req) {
 new Promise(function(resolve, reject){
   src_ip =  (req.query.src_ip || (req.body && req.body.src_ip));
   dst_ip = (req.query.dst_ip || (req.body && req.body.dst_ip));
   port =  (req.query.port || (req.body && req.body.port));
   port_num =  (req.query.port_num || (req.body && req.body.port_num));
   resolve();
 });
   if(!varExists(src_ip)) {
     context.res = {
         status: 400,
         body: "Please pass src_ip."
     };
     return;
   }


   if(!varExists(dst_ip)) {
     context.res = {
         status: 400,
         body: "Please pass dsp_ip."
     };
     return;
   }
  
   if(!varExists(port)) {
   context.res = {
       status: 400,
       body: "Please pass port."
   };
   return;
   }


   if(!varExists(port_num)) {
     context.res = {
         status: 400,
         body: "Please pass port_num."
     };
     return;
   }


   rows = await main()
     if (rows == 0){
       context.res = {
         status: 200,
         body: true
       };
     }
     else {
       context.res = {
         status: 200,
         body: false
       };
     }
}
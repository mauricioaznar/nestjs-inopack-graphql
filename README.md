<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>




-------------------------------------------------------------------------------------------------


## Todo

* products & products testing
* server validation ( date, numbers, emails  (static properties) )
* maybe class inheritance with part operations (part_operations => part_transactions, part_costs)
* adjustments
    * spares substractions must have branch_id, part_id and (retrieval_id or adjustment_id)
    * spares additions must have branch_id and (buyout_id or adjustment_id)
* Add buyout
    * buyout costs
        * quantity, price, spare_id
    * buyout
        * supplier, date
* add retrievals



-------------------------------------------------------------------------------------------------



## Currently implementing



-------------------------------------------------------------------------------------------------




## Done


### 27/04/2022

* refactor
    * re-think tables
    * part -> spare
    * machine_component -> machine_part
* roles authentication


### <= 26/04/2022

* refactor -- date processing
* delete spare category dialog
* missing links
* delete functionality
* remove unused dto properties
* spare page
* logout button is updateing the localstorage but it is not updating the store.
* section and compoment dialogs.
* adjustments
    * spare_subtractions and spare_additions -> spare_transactions


    


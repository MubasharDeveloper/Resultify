import React, { useState } from "react";

const BlankPageLayer = () => {

  const [Btn, setBtn] = useState('danger');


  return (
    <>
      <div className="py-5 text-center">
        <h3>My Favourt Button color is {Btn}</h3>

        <button className="p-2 px-3 m-2 border" onClick={()=>{setBtn('danger')}}>Danger</button>
        <button className="p-2 px-3 m-2 border" onClick={()=>{setBtn('primary')}}>Primary</button>
        <button className="p-2 px-3 m-2 border" onClick={()=>{setBtn('warning')}}>Warning</button>
        <button className="p-2 px-3 m-2 border" onClick={()=>{setBtn('success')}}>Success</button>

        <br/>
        <br/>
        <br/>

        <button className={`btn btn-${Btn}`}>Button {Btn}</button>
      </div>
    </>
  );
};

export default BlankPageLayer;

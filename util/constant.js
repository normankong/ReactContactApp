

// Initialize Dialer Hash
function getDialerHash() {

    let DIALER_HASH = [];
    DIALER_HASH["A"] = 2;
    DIALER_HASH["B"] = 2;
    DIALER_HASH["C"] = 2;
    DIALER_HASH["D"] = 3;
    DIALER_HASH["E"] = 3;
    DIALER_HASH["F"] = 3;
    DIALER_HASH["G"] = 4;
    DIALER_HASH["H"] = 4;
    DIALER_HASH["I"] = 4;
    DIALER_HASH["J"] = 5;
    DIALER_HASH["K"] = 5;
    DIALER_HASH["L"] = 5;
    DIALER_HASH["M"] = 6;
    DIALER_HASH["N"] = 6;
    DIALER_HASH["O"] = 6;
    DIALER_HASH["P"] = 7;
    DIALER_HASH["Q"] = 7;
    DIALER_HASH["R"] = 7;
    DIALER_HASH["S"] = 7;
    DIALER_HASH["T"] = 8;
    DIALER_HASH["U"] = 8;
    DIALER_HASH["V"] = 8;
    DIALER_HASH["W"] = 9;
    DIALER_HASH["X"] = 9;
    DIALER_HASH["Y"] = 9;
    DIALER_HASH["Z"] = 9;

    return DIALER_HASH;
  }


  // Return Object
  let constant = new Object();
  constant.getDialerHash = getDialerHash;

  // Constant String
  constant.DIALPAD_LIST = [1,2,3,4,5,6,7,8,9,"*","0","#"];

  export default constant;
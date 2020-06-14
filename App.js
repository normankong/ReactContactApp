import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking
} from 'react-native';

import Constants from 'expo-constants';
import * as Contacts from 'expo-contacts';
import Icon from 'react-native-vector-icons/Ionicons';
import MyConstants from './util/constant.js';

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      isLoading: false,
      contacts: [],
      inputValue : ""
    };

    this.DIALER_HASH = MyConstants.getDialerHash();
    this.engExp = /^[A-Za-z]/;
    this.digExp = /^[0-9]/;
    this.ascExp = /^[\u0000-\u007F]/;
  }

  // Load Contact List
  loadContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {

        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails]
        });

        // data.forEach(item => console.log(item))
        console.log(`Geting Data : ${data.length}`);

        function comparator(a, b){
            return a.name > b.name;
        }

        let tmp = data.slice(0);
        tmp = tmp.filter(item => item.phoneNumbers != null);
        tmp = this.flattenContact(tmp);

        let engList = tmp.filter(item => this.engExp.test(item.name)).sort(comparator);
        let symList = tmp.filter(item => this.ascExp.test(item.name) && (!this.engExp.test(item.name) && (!this.digExp.test(item.name)))).sort(comparator);
        let digList = tmp.filter(item => this.digExp.test(item.name)).sort(comparator);
        let restList = tmp.filter(item => !(this.digExp.test(item.name) || this.ascExp.test(item.name))).sort(comparator);
       
        // Symbole > English > Digit > Others
        let result = [...symList, ...engList, ...digList, ...restList];
        result = result.map(item => this.createDialerKey(item));

        this.setState({ contacts: result, inMemoryContacts: result, isLoading: false });
    }
  };

  // Some profile have multiple phone number, so flatten the list and remove 852 and add local formatting
  flattenContact = (list) =>{
    console.log(`Before deduplicate : ${list.length}`);
    let result = [];
    for (let i=0; i< list.length; i++){
      let object = list[i]; 
      let phoneNumberList = object.phoneNumbers;

      
      let name = object.name;
      object.isValidName = (this.engExp.test(name) || !this.ascExp.test(name));

      let dedupList = new Set();
      for (let j=0; j< phoneNumberList.length; j++){

        // Local Formatting
        let phoneNumber = phoneNumberList[j].number.replace(/^\+852/g, '').replace(/\D/g,'')
        phoneNumber = (phoneNumber.length == 8) ? phoneNumber.substring(0,4) + "-" + phoneNumber.substring(4) : phoneNumber;
        
        // Deduplicate Phonenumber
        if (!dedupList.has(phoneNumber)){
          dedupList.add(phoneNumber);
          let newObject = JSON.parse(JSON.stringify(object));
          newObject.id += j;
          newObject.phoneNumber = phoneNumber;
          result.push(newObject);
        }
      }
    }
    console.log(`After flatten : ${result.length}`)
    return result;
  }

  // Create Dialer Key 2-->ABC, 3-->DEF
  createDialerKey = (item) =>{
    let name = item.name;
    let dialerKey = '';
    for (let i=0; i < name.length; i++ ){
      let tmp = name[i];

      let key = '';
      if (this.engExp.test(tmp)) {
        tmp = tmp.toUpperCase();
        key = this.DIALER_HASH[tmp];
      }
      if (this.digExp.test(tmp)) {
        key = tmp;
      }
      
      if (key != ''){
        dialerKey += key;
      }
    }

    let obj = {...item, dialerKey};
    return obj;
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    this.loadContacts();
  }

  // Search Contact List
  searchContacts = value => {
    const filteredContacts = this.state.inMemoryContacts.filter(contact => {

      let isDigitMatch = contact.phoneNumber.replace(/-/g, "").indexOf(value) != -1;
      let isDialerMatch = contact.dialerKey.indexOf(value) != -1;

      return isDigitMatch || isDialerMatch;
    });

    console.log(`Match after filter ${filteredContacts.length}`);

    this.setState({ contacts: filteredContacts });
  };

  // Process Dialing
  processDial = ()=>{
    let phoneNumber = this.state.inputValue
    if (phoneNumber == "") return;
    Linking.openURL(`tel:${phoneNumber}`)
  }

  // When selecting the contact
  onSelect = id => {
    // console.log(`Clicked : ${id}`);
    let contact = this.state.contacts.filter(item => item.id == id)[0];
    // console.log(`${contact.name} ${contact.phoneNumber}`);
    let phoneNumber = contact.phoneNumber;
    Linking.openURL(`tel:${phoneNumber}`)
    console.log(contact);
    // console.log(phoneNumber);
  }

  // When Input phone number
  onNumInput = id => {
    let result = this.state.inputValue + id;
    // console.log(result);;
    this.setState({ inputValue: result});
    this.searchContacts(result);
  }

  // Back Button
  onBackButton =() => {
    let result = this.state.inputValue;
    if (result == "") return;
    result = result.substring(0, result.length-1);
    this.setState({ inputValue: result});
    this.searchContacts(result);
  }

  // Get the Dialer Key Pad
  getDisplayPad =(num) =>{
    let keys = Object.keys(this.DIALER_HASH);
    let result = keys.filter(item=>this.DIALER_HASH[item] == num);
    return result.join("");
  }

  // Render Result
  render() {

    console.log("Render")

    return (
      <View style={{ flex: 1 }}>
        <View style={{paddingTop: 20, paddingLeft : 10, paddingBottom:5, backgroundColor: '#2f363c' }}>
          <Text style={{fontSize : 15, color:'white' , textAlignVertical: 'bottom', margin:0}}>Contact List</Text>
          </View>
        
        <View style={{ flex: 1, backgroundColor: '#2f363c' }}>
          {this.state.isLoading ? (
            <View
              style={{
                ...StyleSheet.absoluteFill,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ActivityIndicator size="large" color="#bad555" />
            </View>
          ) : null}

          <FlatList
            data={this.state.contacts}
            renderItem={this.renderRow}
            keyExtractor={item => item.id}
            initialNumToRender={100}
            maxToRenderPerBatch={100}
            windowSize={50}
            ListEmptyComponent={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 50
                }}
              >
                <Text style={{ color: '#bad555' }}>Loading...</Text>
              </View>
            )}
          />
        </View>
        
        {/* DialerText */}
        <View style={{ height: 75, backgroundColor: 'black', padding:0, margin:0 }}>
            <View style={{
                flexDirection: 'row', 
                padding: 5,
                backgroundColor: 'black',
                margin: 5
            }}>    
                <Text style={{width:'88%', fontSize:30, color:'white'}}>{this.state.inputValue}</Text>
                <TouchableOpacity onPress={() => this.onBackButton()}>
                  <View style={{width:50, height:50, backgroundColor:'black', color:'white'}}>
                    <Icon name="md-backspace" size={40} style={{ margin: 5, textAlign:'center', color:'white' }} />
                  </View>
                </TouchableOpacity>
            </View>
        </View>

        {/* Dialer Pack */}
        <View style={{width:'100%', height: 240, backgroundColor: 'black'}}>  
          <FlatList style={styles.dialerPad}
            data={MyConstants.DIALPAD_LIST}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => this.onNumInput(item)}
                style={styles.dialerArea}>
                  <View>
                    <Text style={styles.dialerText}>{item}</Text>
                    <Text style={styles.dialerTexts}>{this.getDisplayPad(item)}</Text>
                  </View>
              </TouchableOpacity>
            )}
            //Setting the number of column
            numColumns={3}
            keyExtractor={item => item}
          />
        </View>

        {/* DialerButton */}
        <View style={{
            padding: 0,
            backgroundColor: 'black', 
            width:'100%',
            height: 50,
            marginBottom :0
          }}>    
            <TouchableOpacity onPress={()=>this.processDial()}>
              <View style={{width:'100%', height:50, backgroundColor:'black', justifyContent:'center'}}>
                <Icon name="ios-call" size={20} style={{ color:'white', margin: 5, textAlign:'center' }} />
              </View>
            </TouchableOpacity>
        </View>
        
      </View>
    );
  }

  renderRow = ({item}) => (
      <TouchableOpacity
        onPress={() => this.onSelect(item.id)}
        style={[
          styles.rows,
          { backgroundColor:  'white'},
        ]}
        >
        <View style={{flexDirection: 'row', flex: 1}}>
          <View style={styles.circle}>
            { item.isValidName ? 
              <Text style={styles.title, {fontSize : 30}}>{item.name.substring(0,1)}</Text> : 
              <Icon name="md-contacts" size={30} style={{ margin: 5, textAlign:'center', color:'black' }} />
            }
          </View>
          <View>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.title}>{item.phoneNumber}</Text>
          </View>
        </View>
      </TouchableOpacity>    
  )
}

/**
 * Style Sheet
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Constants.statusBarHeight
  },
  rows: {
    backgroundColor: 'white',
    padding: 8,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  title: {
    color : "black",
    fontSize: 16,
    paddingLeft: 10,
  },
  back: {
    color : "white",
    fontSize: 20,
  },
  dialerPad : {
    width:'100%',
    backgroundColor: 'black',
    margin:0,
    padding:0,
  },
  dialerArea : {
    backgroundColor : "black",
    width: 140,
    height: 60,
    paddingVertical: 0,
    paddingHorizontal: 1,
    marginVertical : 0,    
    justifyContent: 'center',    
    alignItems: 'center',
  },
  dialerText : {
    color : "white",
    fontSize : 30,
    textAlignVertical: 'bottom',
    justifyContent: 'center',    
    alignItems: 'center'
  },
  dialerTexts : {
    color : "white",
    fontSize : 10,
    textAlignVertical: 'bottom',
    justifyContent: 'center',    
    alignItems: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderWidth : 1,
    borderColor : 'black',
    borderRadius: 100/2,
    backgroundColor: 'white',
    justifyContent: 'center',    
    alignItems: 'center',
  }

});  

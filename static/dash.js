var dashboard = Vue.component('dashboard',{
    template: `
    <div id="main-content">
        <div class="container">
            <div class="row justify-content-center">
                <div id="top-bar">
                    <div class="display-5">Welcome {{ name }}</div> 
                    <div>
                        <button class="btn create-button" v-on:click="create_new_deck">&plus; Add Deck</button>
                        <button class="btn btn-outline-dark" @click="export_all_decks">Export decks</button>
                    </div>
                </div>
                <hr v-if="all_decks.length==0">
                <p v-if="all_decks.length!=0">Here are your decks.</p>
            </div>
            <div class="row justify-content-center">
                <p v-if="all_decks.length==0" style="text-align: center; width:90%;margin-top:10%px" class="alert alert-warning" role="alert"> Oops, you have no decks currently. Create one from above.</p>
                <table v-else class="table">
                    <thead class="thead-dark">
                        <th scope="col" style="width: 10%;">#</th>
                        <th scope="col" style="width: 50%;">Deck Name</th>
                        <th scope="col" style="width: 30%;">Last Seen</th>
                        <th scope="col" style="width: 10%;">Score</th>
                    </thead>
                    <tbody>
                            <deck-obj v-for="(deck,index) in all_decks" v-bind:deck="deck" v-bind:key="deck.deck_id" v-bind:username="username" v-bind:index="index"></deck-obj>
                    </tbody>
                </table>
            </div>
        </div>
            
    </div>`,

    data: function(){
        return {
            username: this.$route.params.username,
            all_decks:[],
            loading:true,
            name: localStorage.getItem("current_user")
        }
    },
    methods:{
        create_new_deck: function(){
            let new_deck_name=prompt("What should be the name of new deck ?");
            this.loading=true
            if (new_deck_name){
                fetch(`${baseURL}/api/${this.username}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'Authorization': localStorage.getItem("token")},
                    body: JSON.stringify({
                        "name":new_deck_name
                    })
                })
                .then(res => {
                    if(res.ok){
                        return res.json()
                    }
                    else if(res.status===401){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => {
                    if (data["error_code"]){
                        if(data["error_code"]=="SESEXP"){
                            alert("Session expired! Please login again !");
                            localStorage.setItem("token","")
                            localStorage.setItem("current_user","")
                            this.$parent.logged=false
                            this.$router.push("/")
                        }
                        else{
                            this.$router.push("/")
                        }
                    }
                    else{
                        let newly_deck=data.new_deck
                        newly_deck.last_seen="just created"
                        this.all_decks.push(data.new_deck);}
                })
                .catch(e => alert("Deck could not be created."));
            }
            this.loading=false
        },
        export_all_decks: function(){
            fetch(`${baseURL}/api/${this.username}/export`, {
                method: 'GET',
                headers: {'Authorization': localStorage.getItem("token")},
            })
            .then(res => {
                if(res.ok){
                    return res.blob()
                }
                else if(res.status===401){
                    this.$router.push("/")
                    localStorage.setItem("token","")
                }
            })
            .then(file => {
                var a = document.createElement("a");
                a.href = window.URL.createObjectURL(file);
                a.download = `${this.username}_all.csv`;
                a.click();
            })
        }
    },
    components:{
        deck_obj
    },
    created: function(){
        document.title="Dashboard"
        this.loading=true;
        fetch(`${baseURL}/api/${this.username}`, {
            method: "GET",
            headers: {'Authorization': localStorage.getItem("token")}
        })
        .then(res => {
            if (res.ok){
                return res.json()
            }
            else if(res.status===401){
                return res.json()
            }
            else{
                throw new Error()
            }
        }).then(data => {
            if (data["error_code"]){
                if(data["error_code"]=="SESEXP"){
                    alert("Session expired! Please login again !");
                    localStorage.setItem("token","")
                    localStorage.setItem("current_user","")
                    this.$parent.logged=false
                    this.$router.push("/")
                }
                else{
                    this.$router.push("/")
                }
            }
            else{
                this.all_decks=data.decks;
                this.all_decks.sort((a,b) => a.deck_score - b.deck_score)
                this.$parent.logged=true
            }
            
        })
        .catch(e => this.all_decks=[]);
        document.title=`Dashboard-${this.username}`;
        this.loading=false
    },
})

var deck_obj = Vue.component('deck-obj',{
    props: {
        deck:{
            type: Object
        },
        index: Number,
        username: String
    },
    computed: {
        card_view_url: function(){
            return `/${this.username}/${this.deck.deck_id}`
        }
    },
    template:`
    <tr>
        <td>{{ index+1 }}</td>
        <th scope="row"><div class="deck-name" @click="goToCards">{{ deck.deck_name }}</div>
            <div class="deck-buttons">
                <button title="Add new card to deck" class="select-action add-cards" v-on:click="add_card_to_deck" >Add Card</button>
                <button title="Export as CSV" class="select-action export" v-on:click="export_deck" >Export</button>
                <button title="Rename this deck" class="select-action rename" v-on:click="rename_deck">Rename</button>
                <button title="Delete this deck" class="select-action delete" v-on:click="delete_deck" >Delete</button>
            </div>
            
        </th>
        <td>{{  deck.last_seen }}</td>
        <td>{{  deck.deck_score }}</td>
    </tr>`,
    methods:{
        rename_deck: function(){
            let new_name=prompt("Enter the new name");
            if(new_name){
                fetch(`${baseURL}/api/${this.$parent.username}/${this.deck.deck_id}`,{
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json','Authorization': localStorage.getItem("token")},
                    body: JSON.stringify({
                        "new_name":new_name
                    })
                })
                .then(res=> {
                    if(res.ok){
                        return res.json()
                    }
                    else if(res.status===401){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => {
                    if (data["error_code"]){
                        if(data["error_code"]=="SESEXP"){
                            alert("Session expired! Please login again !");
                            localStorage.setItem("token","")
                            localStorage.setItem("current_user","")
                            this.$parent.$parent.logged=false
                            this.$router.push("/")
                        }
                        else{
                            this.$router.push("/")
                        }
                    }
                    else{this.deck.deck_name=data.updated_deck.deck_name}
                })
                .catch(e => alert("Deck could not be renamed"))
            }
        },
        delete_deck: function(){
            let consent=confirm(`Are you sure to delete "${this.deck.deck_name}" deck? It will remove all its cards also !`)
            if (consent){
                fetch(`${baseURL}/api/${this.$parent.username}/${this.deck.deck_id}`,{
                    method: 'DELETE',
                    headers: {'Authorization': localStorage.getItem("token")}
                })
                .then(res=> {
                    if(res.ok){
                        return res.json()
                    }
                    else if(res.status===401){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => {
                    if (data["error_code"]){
                        if(data["error_code"]=="SESEXP"){
                            alert("Session expired! Please login again !");
                            localStorage.setItem("token","")
                            localStorage.setItem("current_user","")
                            this.$parent.$parent.logged=false
                            this.$router.push("/")
                        }
                        else{
                            this.$router.push("/")
                        }
                    }
                    else{
                        for(ent in this.$parent.all_decks){
                            if (this.$parent.all_decks[ent].deck_id==data.deck_id){
                                this.$parent.all_decks.splice(ent,1)
                            }
                        }
                    }
                    
                })
                .catch(e => alert("Deck could not be deleted"))
            }
        },
        add_card_to_deck: function(){
            let cardQ= prompt("Question for your new card: ");
            if(cardQ){
                let cardA= prompt("Answer for your new card: ");
                if (cardA){
                    fetch(`${baseURL}/api/${this.username}/${this.deck.deck_id}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': localStorage.getItem("token")},
                        body: JSON.stringify({
                            "question": cardQ,
                            "answer": cardA
                        })
                    })
                    .then(res => {
                        if(res.status===401){
                            return res.json()
                        }
                        else if(!res.ok){
                            console.log("iniside elseif")
                            throw new Error();
                        }
                        return res.json()
                    })
                    .then(data => {
                        if (data["error_code"]){
                            if(data["error_code"]=="SESEXP"){
                                alert("Session expired! Please login again !");
                                localStorage.setItem("token","")
                                localStorage.setItem("current_user","")
                                this.$parent.$parent.logged=false
                                this.$router.push("/")
                            }
                            else{
                                this.$router.push("/")
                            }
                        }
                    })
                    // .catch(e => alert("Card could not be created"))
                }
            }
        },
        export_deck: function(){
            fetch(`${baseURL}/api/${this.username}/${this.deck.deck_id}/export`, {
                method: 'GET',
                headers: {'Authorization': localStorage.getItem("token")},
            })
            .then(res => {
                if(res.ok){
                    return res.blob()
                }
                else if(res.status===401){
                    this.$router.push("/")
                    localStorage.setItem("token","")
                }
            })
            .then(file => {
                var a = document.createElement("a");
                a.href = window.URL.createObjectURL(file);
                a.download = `${this.deck.deck_name}.csv`;
                a.click(); 
            })
        },
        goToCards: function(){
            this.$router.push(this.card_view_url)
        }
    },
    
})

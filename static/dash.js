var dashboard = Vue.component('dashboard',{
    template: `
    <div id="main-content">
        <div class="container">
            <div class="row justify-content-center">
                <div id="top-bar">
                    <div class="display-5">Decks</div> 
                    <button class="btn create-button" v-on:click="create_new_deck">&plus; Add Deck</button>   
                </div>
                <hr v-if="all_decks.length==0">
                <p v-if="all_decks.length!=0">Your have following decks.</p>
            </div>
            <div class="row justify-content-center">
                <p v-if="all_decks.length==0" style="text-align: center; width:90%;margin-top:10%px" class="alert alert-warning" role="alert">You have no decks currently. Create one from above.</p>
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
            loading:true
        }
    },
    methods:{
        create_new_deck: function(){
            let new_deck_name=prompt("What should be the name of new deck ?");
            this.loading=true
            if (new_deck_name){
                fetch(`${baseURL}/api/${this.username}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        "name":new_deck_name
                    })
                })
                .then(res => {
                    if(res.ok){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => {
                    this.all_decks.push(data.new_deck);
                })
                .catch(e => alert("Deck could not be created."));
            }
            this.loading=false
        }
    },
    components:{
        deck_obj
    },
    created: function(){
        this.loading=true;
        fetch(`${baseURL}/api/${this.username}`, {
            method: "GET"
        })
        .then(res => {
            if (res.ok){
                return res.json()
            }
            else{
                throw new Error()
            }
        }).then(data => {
            this.all_decks=data.decks;
            this.all_decks.sort((a,b) => a.deck_score - b.deck_score)
        })
        .catch(e => this.all_decks=[]);
        document.title=`Dashboard :: ${this.username}`;
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        "new_name":new_name
                    })
                })
                .then(res=> {
                    if(res.ok){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => this.deck.deck_name=data.updated_deck.deck_name)
                .catch(e => alert("Deck could not be renamed"))
            }
        },
        delete_deck: function(){
            let consent=confirm(`Are you sure to delete "${this.deck.deck_name}" deck? It will remove all its cards also !`)
            if (consent){
                fetch(`${baseURL}/api/${this.$parent.username}/${this.deck.deck_id}`,{
                    method: 'DELETE'
                })
                .then(res=> {
                    if(res.ok){
                        return res.json()
                    }
                    else{
                        throw new Error()
                    }
                })
                .then(data => {
                    for(ent in this.$parent.all_decks){
                        if (this.$parent.all_decks[ent].deck_id==data.deck_id){
                            this.$parent.all_decks.splice(ent,1)
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
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            "question": cardQ,
                            "answer": cardA
                        })
                    })
                    .then(res => {
                        if(!res.ok){throw new Error();}
                        
                    })
                    .catch(e => alert("Card could not be created"))
                }
            }
        },
        goToCards: function(){
            this.$router.push(this.card_view_url)
        }
    },
    
})

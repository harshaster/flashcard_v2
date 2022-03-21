var dashboard = Vue.component('dashboard',{
    template: `
    <div id="main-content">
            <div class="container">
                <div class="row justify-content-center">
                    <div id="top-bar">
                        <div class="display-5">Decks</div> 
                        <button class="btn create-button" v-on:click="create_new_deck">Create Deck</button>   
                    </div>
                    
                    <p v-if="all_decks.length!=0">Your have following decks.</p>
                </div>
                <div class="row justify-content-center">
                    <p v-if="all_decks.length==0" style="text-align: center;">You have no decks currently. Create one from below.</p>
                    <table v-else class="table">
                        <thead class="thead-dark">
                            <th scope="col" style="width: 10%;">#</th>
                            <th scope="col" style="width: 50%;">Deck Name</th>
                            <th scope="col" style="width: 30%;">Last Seen</th>
                            <th scope="col" style="width: 10%;">Score</th>
                        </thead>
                        <tbody>
                                <deck-obj v-for="(deck,index) in all_decks" v-bind:deck="deck" v-bind:index="index"></deck-obj>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`,

    data: function(){
        return {
            username: this.$route.params.username,
            all_decks:[]
        }
    },
    methods:{
        create_new_deck: function(){
            let new_deck_name=prompt("What should be the name of new deck ?");
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
            .catch(e => alert("Deck could not be created."))
        }
    },
    components:{
        deck_obj
    },
    mounted: function(){
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
        }).then(data => this.all_decks=data.decks)
        .catch(e => this.all_decks=[])
    }

})

var deck_obj = Vue.component('deck-obj',{
    props: {
        deck:{
            type: Object
        },
        index: Number
    },
    template:`
    <tr>
        <td>{{ index+1 }}</td>
        <th scope="row">{{ deck.deck_name }}<br>
            <button class="select-action rename" v-on:click="rename_deck">Rename</button>
            <button class="select-action delete" v-on:click="delete_deck" >Delete</button>
            <button class="select-action add-cards" v-on:click="add_card_to_deck" >Add Card</button>
        </th>
        <td>{{  deck.last_seen }}</td>
        <td>{{  deck.deck_score }}</td>
    </tr>`,
    methods:{
        rename_deck: function(){
            let new_name=prompt("Enter the new name");
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
        },
        delete_deck: function(){
            let consent=confirm(`Are you sure to delete ${this.deck.deck_name} deck? It will remove all its cards also !`)
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
                        if (this.$parent.all_decks[ent].deck_id==this.deck.deck_id){
                            this.$parent.all_decks.pop(ent)
                        }
                    }
                })
                .catch(e => alert("Deck could not be renamed"))
            }
        }
    },
    // data: function(){
    //     return {
    //         deck: this.props.deck
    //     }
    // }
    
})

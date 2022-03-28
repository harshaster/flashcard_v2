const card_view = Vue.component('card-view', {
    data: function(){
        return {
            current_card_index:0,
            hidden:true,
            all_cards:[],
            username:this.$route.params.username,
            deck_id:this.$route.params.deck_id,
            card_font_size:30,
            editing: false,
            loading:true,
            noCards:false
        }
    },
    computed:{
        current_card: function(){
            return this.all_cards[this.current_card_index]
        },
        prevnotAllowed: function(){
            return this.current_card_index==0;
        },
        nextnotAllowed: function(){
            return this.current_card_index==(this.all_cards.length-1)
        },
        
    },
    template: `
        <div id="main-content">
            <div class="h2" v-if="noCards" style="text-align:center;">
                You have no cards. Add one from <span @click="goToDash" style="color:blue;cursor:pointer">dashboard</span>.
            </div>
            <div class="container" v-if="current_card">
                <div>
                    <button class="btn btn-outline-secondary card-button" data-toggle="modal" data-target="#update-card" @click="edit_card">Edit</button>
                    <button class="btn btn-outline-danger card-button" @click="delete_card">Delete</button>
                    <button class="btn btn-outline-dark card-button" @click="incFontsize">&plus;</button>
                    <button class="btn btn-outline-dark card-button" @click="decFontsize">&minus;</button>
                </div>
                <div>
                    <div id="card-view-wrapper">
                        <div class="small-navig-wrapper"><button class="small-navig" v-bind:disabled="this.prevnotAllowed" v-on:click="current_card_index -= 1;hidden=true">&lt;&lt;</button></div>
                        <form v-if="editing" id="card-update" class="form-group">
                            <input type="text" class="form-control non-buttons"  name="question" v-bind:value="this.current_card.card_question">
                            <input type="text" class="form-control non-buttons" name="answer" v-bind:value="this.current_card.card_answer">
                            <button type="button" class="form-control btn btn-primary card-button" v-on:click="submit_edit" >Save Changes</button>
                            <button type="button" class="form-control btn btn-secondary card-button" v-on:click="close_edit" >Cancel</button>
                        </form>
                        
                        <div id="card-front" v-if="!editing">
                            <div style="overflow:auto;">{{ current_card.card_question }}</div>
                            <div v-if="!hidden">{{ current_card.card_answer }}</div>
                        </div>
                        <div class="small-navig-wrapper"><button class="small-navig" v-bind:disabled="this.nextnotAllowed" v-on:click="current_card_index += 1;hidden=true">&gt;&gt;</button></div>
                    </div>
                </div>
                <div class="show-answer">
                    <button class="btn btn-outline-dark card-button" v-bind:disabled="this.prevnotAllowed" id="prevButton" v-on:click="current_card_index -= 1;hidden=true">&lt;&lt; Prev</button>
                    <button class="btn btn-primary card-button" v-if="hidden" v-on:click="hidden=false">Show Answer</button>
                    <div class="btn-group" role="group" v-if="!hidden">
                        <input type="button" class="btn btn-outline-primary" @click="send_score(30)" value="Easy"  autocomplete="off">
                        <input type="button" class="btn btn-outline-primary" @click="send_score(20)" value="Medium" autocomplete="off">
                        <input type="button" class="btn btn-outline-primary" @click="send_score(10)" value="Hard" autocomplete="off">
                    </div>
                    <button class="btn btn-outline-dark card-button" v-bind:disabled="this.nextnotAllowed" id="nextButton" v-on:click="current_card_index += 1;hidden=true">Next &gt;&gt;</button>
                </div>
            </div>
            <div id="loading-page" v-if="loading">
                <div id="loading-page-inner">
                    <div style="display: flex;justify-content: center;">
                        <div id="circ1"></div>
                        <div id="circ2"></div>
                        <div id="circ3"></div>
                    </div>
                </div>
            </div>
        </div>`,
    created: function(){
        fetch(`${baseURL}/api/${this.username}/${this.deck_id}`, {
            method: 'GET',
            headers: {'Authorization': localStorage.getItem("token")}
        })
        .then(res => {
            if(res.ok){
                return res.json()
            }
            else if(res.status===401){
                return res.json()
            }
            throw new Error();
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
                if(data.deck_cards.length===0){
                    this.noCards=true
                    
                }
                else{
                    this.all_cards=data.deck_cards;
                    this.all_cards.sort((x,y) => x.score - y.score)
                    this.$parent.logged=true
                }
                this.loading=false
            }
            
        })
        .catch(e => {console.log(e);this.all_cards=[];alert("Something went wrong");this.$router.push(`/${this.username}`)});
    },
    methods:{
        incFontsize: function(){
            if(this.card_font_size<80){
                this.card_font_size += 3 ;
                document.getElementById("card-front").style.fontSize=`${this.card_font_size}px`
            }
            else{
                alert("Maximum font size reached")
            }
            
        },
        decFontsize: function(){
            if(this.card_font_size>10){
                this.card_font_size -= 3 ;
                document.getElementById("card-front").style.fontSize=`${this.card_font_size}px`
            }
            else{
                alert("Minimum font size reached")
            }
        },
        delete_card: function(){
            let consent = confirm("Do you really want to delete this card ? ")
            if(consent){
                fetch(`${baseURL}/api/${this.username}/${this.deck_id}/${this.current_card.card_id}`, {
                    method: 'DELETE',
                    headers: {'Authorization': localStorage.getItem("token")}
                })
                .then(res => {
                    if(res.ok){
                        try{
                            this.all_cards.splice(this.current_card_index,1);
                            if (this.all_cards.length===0){
                                this.noCards=true
                            }
                        }
                        catch(e){
                            throw(new Error(e))
                        }
                        
                        return res.json();
                    }
                    else if(res.status===401){
                        return res.json()
                    }
                    throw new Error()
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
                })
                .catch(e => console.log(e))
            }
        },
        edit_card: function(){
            this.editing=true;
        },
        submit_edit: function(){
            fetch(`${baseURL}/api/${this.username}/${this.deck_id}/${this.current_card.card_id}`, {
                method: 'PUT',
                headers: {'Authorization': localStorage.getItem("token")},
                body: new FormData(document.getElementById("card-update"))
            })
            .then(res => {
                if(res.ok){
                    return res.json()
                }
                else if(res.status===401){
                    return res.json()
                }
                throw new Error()
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
                    this.all_cards[this.current_card_index].card_question=data.updated_card.question;
                    this.all_cards[this.current_card_index].card_answer=data.updated_card.answer;
                }
                
            })
            .catch(e => prompt("Changes could not be saved !"));
            this.editing=false
        },
        close_edit: function(){
            this.editing=false
        },
        send_score: function(score){
            fetch(this.current_card.query_url, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', 'Authorization': localStorage.getItem("token")},
                body: JSON.stringify({
                    "score": score
                })
            })
            .then(res => {
                if(res.ok){
                    return res.json()
                }
                else if(res.status===401){
                    return res.json()
                }
                throw new Error()
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
                    this.current_card.score=data.updated_card.new_score_card;
                    this.hidden=true;
                    if(!this.nextnotAllowed){
                        this.current_card_index += 1;
                    }
                    else{
                        alert("Congratulations !! You have finished this deck for now. Come back later.");
                        this.$router.push(`/${this.username}`)
                    }
                }
                
            })
            .catch(e => alert("Score could not be updated !"))
            
        },
        goToDash: function(){
            this.$router.push(`/${this.username}`)
        }
    }

})


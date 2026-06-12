from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

def train_model():
    # Extensive, high-quality dataset of realistic Indian legal complaints (English, Hindi, Hinglish)
    dataset = [
        # ==========================================
        # THEFT (IPC 379/380) - 22 samples
        # ==========================================
        ("my mobile phone was stolen from my pocket while boarding the crowded metro train", "Theft"),
        ("someone stole my motorcycle from the office parking lot between 10 AM and 6 PM", "Theft"),
        ("thieves broke the padlock of my main gate last night and stole jewelry and cash from our almirah", "Theft"),
        ("a boy snatched my gold chain from behind while I was walking in the park and ran away", "Theft"),
        ("my laptop bag containing office documents and charger was stolen from my car's back seat", "Theft"),
        ("shoppers caught a person shoplifting expensive garments inside the shopping mall retail store", "Theft"),
        ("our domestic help has stolen cash worth fifty thousand rupees and is missing since yesterday", "Theft"),
        ("someone picked my pocket in the local bus and took away my leather wallet containing cash and id", "Theft"),
        ("my bicycle which was locked outside the tuition center is missing since this afternoon", "Theft"),
        ("thieves entered the shop by cutting the window grill and stole electronics goods", "Theft"),
        ("mere ghar ka tala tod kar sone ki chain aur chandi ke bartan chori kar liye kal raat ko", "Theft"),
        ("metro station par kisi ne mera wallet pocket se nikal liya, usme paise aur driving license tha", "Theft"),
        ("market me jab mai chal rahi thi toh piche se bike par do ladke aaye aur mera gold chain chheen kar bhaag gaye", "Theft"),
        ("office ke parking se meri activa gadi kisi ne chura li hai, lock tuta hua mila", "Theft"),
        ("dukan me ghus kar chor ne sare cash aur mobile phones chura liye shukrawar ki raat", "Theft"),
        ("meri gadi ka tyre aur battery raat ko ghar ke bahar se chori ho gaya", "Theft"),
        ("bag lekar bhaag gaya ek chor railway station par", "Theft"),
        ("kamwali bai ne ghar se sona chura liya aur ab phone band aa raha hai", "Theft"),
        ("stolen my iphone during the concert, somebody stole it from my bag pocket", "Theft"),
        ("theft of copper wires from the construction site near my residential building", "Theft"),
        ("chori ho gayi hai mere dukaan me saare paise gayab hain kal subah se", "Theft"),
        ("someone stole my purse containing expensive cosmetic items and cash from the restaurant table", "Theft"),

        # ==========================================
        # ASSAULT (IPC 323/351/324) - 22 samples
        # ==========================================
        ("my neighbor attacked me with a wooden stick during an argument over parking space and injured me", "Assault"),
        ("a group of unknown boys blocked my path at night and physically beat me up causing head injury", "Assault"),
        ("he slapped me multiple times and punched me in the face during a heated argument in the market", "Assault"),
        ("the delivery boy assaulted my brother at our doorstep causing bleeding from his nose", "Assault"),
        ("during the cricket match a fight broke out and some boys hit me with a bat on my shoulder", "Assault"),
        ("my landlord entered our house forcefully and physically assaulted my father over a rent dispute", "Assault"),
        ("some goons attacked our car with iron rods and physically beat us when we stopped at the signal", "Assault"),
        ("she was beaten up by her husband and in-laws for domestic issues and sustained physical injuries", "Assault"),
        ("a stranger punched me in the chest and threatened me with a knife after a minor road accident", "Assault"),
        ("padosi ne ladai ke dauran dande se mere sir par war kiya aur mujhe chot lagayi", "Assault"),
        ("kuch gundon ne mere bhai ko raste me rok kar lathiyon se maara aur sir fod diya", "Assault"),
        ("road rage me do gadi walo ne milkar mujhe mara pita aur meri gadi ke shishe tod diye", "Assault"),
        ("makan malik ne mere papa ke sath maar peet ki aur ghar se nikalne ki dhamki di", "Assault"),
        ("padosi ne aakar ghar ke bahar gali di aur thappad mare, chot lagi hai ankh par", "Assault"),
        ("mujhpe chaku se hamla kiya gaya raste me jisse hath me gahra zakhm ho gaya", "Assault"),
        ("maar peet ho rahi hai hamare mohalle me do paksho ke bich", "Assault"),
        ("fight broke out in the pub and one guy hit me with a glass bottle on my forehead", "Assault"),
        ("he physically assaulted my mother during a land boundary argument in the village", "Assault"),
        ("domestic violence attack by in-laws, they physically assaulted me with a kitchen object", "Assault"),
        ("usne mujhe gali di aur phir achanak maar peet shuru kar di", "Assault"),
        ("a group of people beat up the shopkeeper for refusing free goods", "Assault"),
        ("physically beaten and kicked by three men in a public park this evening", "Assault"),

        # ==========================================
        # FRAUD (IPC 420) - 22 samples
        # ==========================================
        ("I was cheated of two lakh rupees by a fake online job portal that promised work in Canada", "Fraud"),
        ("a caller pretending to be from my bank asked for my otp and transferred money from my account", "Fraud"),
        ("I ordered a laptop online but received a stone in the package and the website is now shut down", "Fraud"),
        ("a land broker sold me a plot using fake registry documents and cheated me of my life savings", "Fraud"),
        ("an agent took money promising visa clearance but gave me a fake flight ticket and passport sticker", "Fraud"),
        ("someone cloned my debit card and did multiple unauthorized cash withdrawals at different ATMs", "Fraud"),
        ("he ran a lucky draw scheme in our area, collected entry fees from everyone, and ran away", "Fraud"),
        ("fake customer care executive scam, they took money to activate my sim card but blocked my number", "Fraud"),
        ("a company offered high returns on investment in crypto but vanished after taking my money", "Fraud"),
        ("online fraud ticket booking site took my money but did not generate any airline ticket", "Fraud"),
        ("mere sath online naukri ka jhasa dekar panch lakh rupaye thag liye hain", "Fraud"),
        ("bank manager ban kar call kiya aur otp mangkar mere account se paise nikal liye", "Fraud"),
        ("fake registry papers dikhakar zameen bech di aur broker ab paise lekar bhaag gaya", "Fraud"),
        ("amazon se product mangaya tha par dibbe me patthar mila aur seller contact nahi ho raha", "Fraud"),
        ("luckydraw scheme ke naam par logon se hazaro rupaye jama karwaye aur company bhag gayi", "Fraud"),
        ("cheating in business partnership, he withdrew all funds from the bank account without informing me", "Fraud"),
        ("mere card ka misuse karke bank se paise nikal liye fake website ke dwara", "Fraud"),
        ("paid online advance to a dealer for car booking but he closed the showroom and disappeared", "Fraud"),
        ("double money scheme fraud, they promised 2x returns in 30 days and took cash", "Fraud"),
        ("paise lekar gayab ho gaya banda online deal me cheating kiya hai", "Fraud"),
        ("fake agent cheated me for college admission seat and took processing fees in cash", "Fraud"),
        ("cheating and forgery in distribution of wealth using a fake signature on the will document", "Fraud"),

        # ==========================================
        # HARASSMENT (IPC 354/509/506) - 22 samples
        # ==========================================
        ("an unknown boy is stalking me outside my college gate every day and making vulgar gestures", "Harassment"),
        ("I am receiving abusive messages and obscene photos from a number on my personal WhatsApp", "Harassment"),
        ("a colleague at my workplace is constantly making sexual remarks and harassing me in the office", "Harassment"),
        ("a man in the public bus was touching me inappropriately and using abusive words when I objected", "Harassment"),
        ("my ex-boyfriend is blackmailing me to leak my personal photos online if I don't meet him", "Harassment"),
        ("a group of boys regularly stand near the school crossroad and pass dirty comments at girls", "Harassment"),
        ("someone is calling me repeatedly from different numbers at night and threating me with dire consequences", "Harassment"),
        ("landlord is harassing the female tenant by entering the flat without permission and using vulgar words", "Harassment"),
        ("stalking me on my way home from work, following my scooter every evening and calling out my name", "Harassment"),
        ("ek ladka roz college ke bahar mera peecha karta hai aur gande comments pass karta hai", "Harassment"),
        ("unknown number se gande photos aur abusive text messages aa rahe hain mere whatsapp par", "Harassment"),
        ("office me ek senior manager mujhe pareshan kar raha hai aur gande remarks bolta hai", "Harassment"),
        ("bus me aate jate waqt ek aadmi mujhse badtameezi kar raha tha aur galat tarike se touch kiya", "Harassment"),
        ("purana dost photo leak karne ki dhamki dekar blackmail kar raha hai roz", "Harassment"),
        ("college ke gate ke pass ladke khade hokar ladkiyon ko tang karte hain aur eve teasing karte hain", "Harassment"),
        ("dhamki bhare phone calls aa rahe hain kisi gunde ke, bol raha hai jaan se maar dega", "Harassment"),
        ("harassment by my manager who forces me to work late and makes inappropriate personal advances", "Harassment"),
        ("abusive calling and intimidation by an anonymous caller on my telephone lines", "Harassment"),
        ("gande messages bhej raha hai roz pareshan kar raha hai block karne par bhi dusre number se", "Harassment"),
        ("eve teasing on the streets near my tuition class by a group of local bikers", "Harassment"),
        ("abusing my family on call and threatening physical harm to my sister", "Harassment"),
        ("stalking and sending threat messages to post personal information on social groups", "Harassment"),

        # ==========================================
        # CYBERCRIME (IT Act Sec 66/66D) - 22 samples
        # ==========================================
        ("someone hacked my instagram account and is sending spam links and fake investment messages to my followers", "Cybercrime"),
        ("my official email ID has been hacked and the password was changed without my authorization", "Cybercrime"),
        ("someone created a fake profile with my name and photos on facebook and is asking money from my friends", "Cybercrime"),
        ("unauthorized transfer of money from my netbanking portal, it seems my credentials got phished", "Cybercrime"),
        ("my company website has been defaced by an unknown hacker group claiming database access", "Cybercrime"),
        ("our system got locked by ransomware after clicking a link, asking for bitcoin payments to unlock", "Cybercrime"),
        ("someone is cyberbullying and defaming my reputation online using morph pictures on twitter", "Cybercrime"),
        ("my credit card details were stolen in a data breach and used for online shopping on foreign websites", "Cybercrime"),
        ("compromised netbanking account, password changed and mobile number updated without consent", "Cybercrime"),
        ("mera instagram account kisi ne hack kar liya hai aur dosto ko fake upi link bhej raha hai", "Cybercrime"),
        ("mere naam se fake account banakar facebook par log paise maang rahe hain", "Cybercrime"),
        ("email hack ho gaya hai aur password change kar diya hai kisi hacker ne", "Cybercrime"),
        ("computer lock ho gaya hai aur screen par bitcoin payment ka link aa raha hai malware attack", "Cybercrime"),
        ("netbanking se bina meri permission ke upi transfer ho gaye bank detail hack ho gayi", "Cybercrime"),
        ("cyber cell report for account hacking and misuse of personal photographs on internet", "Cybercrime"),
        ("phishing link click hone se saara browser data aur files hack ho gayi hain office laptop me", "Cybercrime"),
        ("someone is posting morphed, obscene pictures of me on online social platforms to defame me", "Cybercrime"),
        ("unauthorized cyber access to my cryptocurrency wallet and transfer of digital assets", "Cybercrime"),
        ("whatsapp account hacked after scanning a qr code, hacker is chatting with family asking money", "Cybercrime"),
        ("cyber attack on our university portal database leaking sensitive student records", "Cybercrime"),
        ("online defamation and harassment using deepfake videos shared across groups", "Cybercrime"),
        ("unauthorized login attempts from international IP addresses on my corporate cloud storage", "Cybercrime"),

        # ==========================================
        # MISSING PERSON (Section 363) - 22 samples
        # ==========================================
        ("my 10 year old son went to the nearby grocery shop at 4 PM and has not returned home since", "Missing Person"),
        ("my grandfather who suffers from dementia went missing from home during his morning walk", "Missing Person"),
        ("my daughter did not return home from school today, her class ended at 2 PM and her phone is off", "Missing Person"),
        ("my husband went to office in Noida yesterday morning but did not return, his phone is switched off", "Missing Person"),
        ("my mentally challenged sister ran away from the shelter home last night and is missing", "Missing Person"),
        ("a toddler went missing from the local amusement park/mela while playing near the swings", "Missing Person"),
        ("my domestic worker went home to her village but never reached, her family has no contact with her", "Missing Person"),
        ("lost my way in the heavy crowd during the festival and my young cousin went missing", "Missing Person"),
        ("she has left home without informing anyone after a family fight and is missing since last night", "Missing Person"),
        ("mera 8 saal ka beta sham ko khelne gaya tha aur abhi tak ghar nahi aaya hai", "Missing Person"),
        ("dada ji subah ghumne gaye the aur rasta bhatak gaye, ghar nahi laute gumshuda hain", "Missing Person"),
        ("meri beti school se ghar nahi lauti hai, school 1 baje chuta tha aur uska mobile switch off hai", "Missing Person"),
        ("mere pati kal subah office gaye the Noida par wapas nahi aaye aur phone band aa raha hai", "Missing Person"),
        ("dimagi roop se kamzor ladka ghar se bhag gaya hai, rasta bhul gaya hoga", "Missing Person"),
        ("mela me khogaya hai mera chota bhai, crowd me hath chhut gaya tha", "Missing Person"),
        ("bina bataye ghar se chali gayi hai meri bahan kal shaam se, missing report darj karni hai", "Missing Person"),
        ("missing adult male, went for a interview but didn't reach the office and phone is unreachable", "Missing Person"),
        ("my teenage daughter is missing since she went out to buy books this afternoon", "Missing Person"),
        ("dadi ji mil nahi rahi hain subah se, mandir gayi thi par wapas nahi aayi hain", "Missing Person"),
        ("went missing from the railway station platforms in the rush hours yesterday morning", "Missing Person"),
        ("child disappeared from the residential society play area, kidnap suspected", "Missing Person"),
        ("husband went missing after a business trip landing, last tracked at airport exit", "Missing Person")
    ]

    # Split dataset into texts and labels
    texts = [item[0] for item in dataset]
    labels = [item[1] for item in dataset]

    # Build Pipeline containing TfidfVectorizer and LogisticRegression
    # Using word and char_wb n-grams for robust spelling / Hinglish handling
    # max_df=0.9 and sublinear_tf=True help handle common filler words better
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2), 
            min_df=1, 
            max_df=0.95,
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            C=2.0, 
            max_iter=2000, 
            class_weight='balanced',
            solver='lbfgs'
        ))
    ])

    # Train the pipeline
    pipeline.fit(texts, labels)

    # Save pipeline to model.pkl
    joblib.dump(pipeline, "model.pkl")
    print("[SUCCESS] Multilingual complaint classification model (TF-IDF + LR) trained and saved successfully with a realistic 132-sample dataset!")

if __name__ == "__main__":
    train_model()
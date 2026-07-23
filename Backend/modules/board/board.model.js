import mongoose from 'mongoose';
const elementSchema = new mongoose.Schema(
  {
    id:          { 
        type: String,
         required: true
         },

    type:        {
         type: String,
          required: true
         },  

    x:           {
         type: Number,
          required: true,
           default: 0
         },

    y:           {
         type: Number,
          required: true,
           default: 0
         },

    width:       {
         type: Number,
          default: 100
         },

    height:      {
         type: Number,
          default: 100
         },

    rotation:    {
         type: Number,
          default: 0
         },

    zIndex:      {
         type: Number,
          default: 0
         },

    data:        {
         type: mongoose.Schema.Types.Mixed,
          default: {}
         }, 

    createdBy:   {
         type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
           required: true 
        },

    updatedBy:   {
         type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
           required: true
         },
  },
  { _id: false }
);
 
//  Member Sub-schema
const memberSchema = new mongoose.Schema(
  {
    userId:   {
         type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
           required: true
         },

    role:     {
         type: String,
          enum: ['owner', 'editor', 'viewer'],
           default: 'editor'
         },
         
    status:   {
         type: String,
          enum: ['pending', 'accepted'],
           default: 'pending'
         },

    joinedAt: {
         type: Date,
          default: Date.now
         },

  },
  { _id: false }
);
 
// Board Schema 
const boardSchema = new mongoose.Schema(
  {
    title: {
      type:    String,
      required: [true, 'Board title is required'],
      trim:    true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
 
    description: {
      type:    String,
      trim:    true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
 
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
 
    members: {
      type:    [memberSchema],
      default: [],
    },
 
    canvas: {
      elements: {
        type:    [elementSchema],
        default: [],
      },
      background: {
        type:    String,
        default: '#ffffff',
      },
      viewport: {
        x:    { 
            type: Number,
             default: 0 
            },

        y:    {
             type: Number,
              default: 0 
            },

        zoom: { 
            type: Number,
             default: 1,
              min: 0.1,
               max: 10
             },

      },
    },
 
    isPublic: {
      type:    Boolean,
      default: false,
    },
 
    thumbnail: {
      type:    String,
      default: null,
    },
 
    lastActivityAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


// Dashboard query: "all boards I own, sorted by recent activity"
boardSchema.index({ owner: 1, lastActivityAt: -1 });

// Dashboard query: "all boards I'm a member of"
boardSchema.index({ 'members.userId': 1, lastActivityAt: -1 });

// Public board discovery
boardSchema.index({ isPublic: 1, lastActivityAt: -1 });


// imp
// Total collaborator count (owner + members) — useful for the board card UI
boardSchema.virtual('collaboratorCount').get(function () {
    return this.members.length + 1;
});


const toIdStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  
  let idVal = val;
  if (val._id) {
    idVal = val._id;
  } else if (val.id && typeof val.id === 'string') {
    idVal = val.id;
  } else if (val.userId) {
    idVal = val.userId;
  } else if (val.user) {
    idVal = val.user;
  }

  if (typeof idVal === 'string') return idVal;
  
  if (idVal && typeof idVal.toString === 'function') {
    const str = idVal.toString();
    if (str && str !== '[object Object]') return str;
  }
  
  return String(idVal);
};

// return the role of a given userID on this boardSchema.
// call this in the service layer for permission checks.
boardSchema.methods.getRoleOf = function (userId) {
  const id = toIdStr(userId);
  if (toIdStr(this.owner) === id) return 'owner';
  const member = this.members?.find((m) => toIdStr(m.userId || m.user || m) === id);
  return member ? member.role : null;
};

// checks weather a user can write to the canvas.
// owner and editors can; viewers cannot.
boardSchema.methods.canEdit = function (userId) {
  const role = this.getRoleOf(userId);
  return role === 'owner' || role === 'editor';
};

const Board = mongoose.model('Board', boardSchema);
export default Board;
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pineapple extends Model
{
    protected $guarded = [];

    public function photos()
    {
        return $this->hasMany(Photo::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ujiLabs()
    {
        return $this->hasMany(UjiLab::class);
    }
}